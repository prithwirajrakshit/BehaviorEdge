import os
import hmac
import hashlib
import json
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks, Header, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, ProcessedEvent
from logging_config import logger

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret_key_2026")

# Async handler for updating subscription tier in DB
def process_subscription_update(db: Session, event_data: dict):
    try:
        data_object = event_data.get("data", {}).get("object", {})
        customer_email = data_object.get("customer_details", {}).get("email") or data_object.get("email")
        
        # If Stripe customer doesn't have email in metadata, try nested structures
        if not customer_email:
            customer_email = data_object.get("metadata", {}).get("email")
            
        if not customer_email:
            logger.warning("Stripe webhook contains no customer email, skipping db update")
            return
            
        event_type = event_data.get("type")
        subscription_status = data_object.get("status")
        
        # Determine target subscription tier based on event type/status
        if event_type == "customer.subscription.deleted" or subscription_status in ["canceled", "unpaid"]:
            tier = "free"
        elif event_type in ["customer.subscription.created", "customer.subscription.updated"]:
            # Example logic matching price ID to tier
            price_id = data_object.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")
            tier = "premium" if price_id == "price_premium_id" else "pro"
        else:
            tier = "free"
            
        user = db.query(User).filter(User.email == customer_email).first()
        if user:
            user.subscription_tier = tier
            db.commit()
            logger.info(f"Updated subscription tier for user {customer_email} to '{tier}' successfully")
        else:
            logger.warning(f"User with email {customer_email} not found in database for subscription sync")
            
    except Exception as e:
        logger.error(f"Failed to process subscription update asynchronously: {e}")

# Verifies webhook signature locally (Stripe-compatible HMAC verification)
def verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    if not sig_header or not secret:
        return False
    try:
        # Stripe signature format: t=timestamp,v1=signature
        pairs = sig_header.split(",")
        timestamp = ""
        signature = ""
        for pair in pairs:
            k, v = pair.split("=")
            if k == "t":
                timestamp = v
            elif k == "v1":
                signature = v
                
        if not timestamp or not signature:
            return False
            
        # Create expected signature payload
        signed_payload = f"{timestamp}.".encode("utf-8") + payload
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_sig, signature)
    except Exception:
        return False

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db)
):
    payload = await request.body()
    
    # Verify the Stripe webhook signature for security
    if not verify_stripe_signature(payload, stripe_signature, STRIPE_WEBHOOK_SECRET):
        logger.warning("Stripe signature verification failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature verification"
        )
        
    try:
        event_data = json.loads(payload.decode("utf-8"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
        
    event_id = event_data.get("id")
    if not event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing event ID"
        )
        
    # Enforce idempotency: check if event was already handled
    processed = db.query(ProcessedEvent).filter(ProcessedEvent.event_id == event_id).first()
    if processed:
        logger.info(f"Duplicate Stripe event {event_id} ignored (already processed)")
        return {"status": "ignored", "reason": "already_processed"}
        
    # Record event ID immediately to lock against concurrent duplicate deliveries
    new_event = ProcessedEvent(event_id=event_id)
    db.add(new_event)
    db.commit()
    
    # Offload processing asynchronously to BackgroundTasks to respond quickly
    background_tasks.add_task(process_subscription_update, db, event_data)
    
    return {"status": "success", "event_id": event_id}
