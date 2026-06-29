from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User, Rule
from schemas import UserCreate, UserLogin, Token, ForgotPassword, VerifyOtp, ResetPassword, GoogleLoginRequest
from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv
import os
import datetime
import random
import hmac
import time
from google.oauth2 import id_token
from google.auth.transport import requests
from redis_client import redis_client, in_memory_lockouts
from logging_config import log_auth_event

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
ALGORITHM = "HS256"

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

from dependencies import decode_supabase_token

def get_current_user(token: str, db: Session):
    try:
        payload = decode_supabase_token(token)
        supabase_id = payload.get("sub")
        if not supabase_id:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        user = db.query(User).filter(User.supabase_id == supabase_id).first()
        if not user:
            # Auto-provision user record locally to preserve relational keys
            email = payload.get("email")
            username = email.split("@")[0] if email else f"user_{supabase_id[:8]}"
            
            # De-duplicate username if already taken
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User(
                supabase_id=supabase_id,
                email=email,
                username=username,
                password_hash=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Seed 8 default trading rules for the user (matches onboarding)
            default_rules = [
                ("Only trade during my planned session", "Session Rules"),
                ("Never move stop loss against my position", "Risk Rules"),
                ("Wait for market structure shift confirmation before entry", "Entry Rules"),
                ("Never risk more than 1% per trade", "Risk Rules"),
                ("Do not trade after 2 consecutive losses in one session", "Mindset Rules"),
                ("Only take trades with minimum 3 confluences", "Entry Rules"),
                ("Always have a clear target before entering", "Exit Rules"),
                ("Do not trade during high-impact news events", "Session Rules"),
            ]
            for text, cat in default_rules:
                rule = Rule(user_id=user.id, rule_text=text, category=cat, is_active=True)
                db.add(rule)
            db.commit()
            
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect email or password")


def generate_otp() -> str:
    """Generate a random 6-digit OTP."""
    return str(random.randint(100000, 999999))

def verify_otp_safe(stored: str, provided: str) -> bool:
    """Constant-time OTP comparison to prevent timing attacks."""
    return hmac.compare_digest(stored, provided)

# ── Signup & Login (existing) ─────────────

@router.post("/signup", response_model=Token)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed 8 default trading rules for the new user
    default_rules = [
        ("Only trade during my planned session", "Session Rules"),
        ("Never move stop loss against my position", "Risk Rules"),
        ("Wait for market structure shift confirmation before entry", "Entry Rules"),
        ("Never risk more than 1% per trade", "Risk Rules"),
        ("Do not trade after 2 consecutive losses in one session", "Mindset Rules"),
        ("Only take trades with minimum 3 confluences", "Entry Rules"),
        ("Always have a clear target before entering", "Exit Rules"),
        ("Do not trade during high-impact news events", "Session Rules"),
    ]
    for text, cat in default_rules:
        rule = Rule(user_id=user.id, rule_text=text, category=cat, is_active=True)
        db.add(rule)
    db.commit()

    token = create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    lock_key = f"lockout:ip:{client_ip}"
    attempts_key = f"attempts:ip:{client_ip}"
    
    # Check if locked out in Redis
    if redis_client:
        is_locked = redis_client.get(lock_key)
        if is_locked:
            raise HTTPException(
                status_code=423, 
                detail="Account locked due to consecutive failed login attempts. Please try again in 15 minutes."
            )
    else:
        lock_info = in_memory_lockouts.get(client_ip, {})
        lock_until = lock_info.get("lock_until", 0)
        if time.time() < lock_until:
            raise HTTPException(
                status_code=423, 
                detail="Account locked due to consecutive failed login attempts. Please try again in 15 minutes."
            )

    user = db.query(User).filter(User.username == data.username).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        log_auth_event(False, data.username, client_ip, "Incorrect credentials")
        
        # Increment failed login attempts
        if redis_client:
            attempts = redis_client.incr(attempts_key)
            redis_client.expire(attempts_key, 600)  # reset after 10 mins of no failures
            if attempts >= 5:
                redis_client.set(lock_key, "locked", ex=900)  # 15 mins lock
                redis_client.delete(attempts_key)
                raise HTTPException(
                    status_code=423, 
                    detail="Account locked due to consecutive failed login attempts. Please try again in 15 minutes."
                )
            # Apply progressive delay (throttle requests)
            time.sleep(min(8, 2 ** attempts))
        else:
            if client_ip not in in_memory_lockouts:
                in_memory_lockouts[client_ip] = {"attempts": 0, "lock_until": 0}
            in_memory_lockouts[client_ip]["attempts"] += 1
            attempts = in_memory_lockouts[client_ip]["attempts"]
            
            if attempts >= 5:
                in_memory_lockouts[client_ip]["lock_until"] = time.time() + 900
                in_memory_lockouts[client_ip]["attempts"] = 0
                raise HTTPException(
                    status_code=423, 
                    detail="Account locked due to consecutive failed login attempts. Please try again in 15 minutes."
                )
            time.sleep(min(8, 2 ** attempts))
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    # Reset attempts on successful authentication
    if redis_client:
        redis_client.delete(attempts_key)
        redis_client.delete(lock_key)
    else:
        if client_ip in in_memory_lockouts:
            del in_memory_lockouts[client_ip]
            
    log_auth_event(True, data.username, client_ip, "Successful login")
    token = create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/google-login")
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=500,
            detail="Google Client ID is not configured on the server"
        )
    
    try:
        # Verify the Google JWT token
        idinfo = id_token.verify_oauth2_token(
            data.credential, 
            requests.Request(), 
            client_id
        )
        
        # Verify token issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        email = idinfo.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
            
        # Check if user already exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create a new user with a base username from the email prefix
            base_username = email.split('@')[0]
            username = base_username
            
            # De-duplicate username if already taken
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
                
            # Create secure random temporary password hash
            temp_password = f"google_temp_{random.randint(100000000, 999999999)}"
            password_hash = hash_password(temp_password)
            
            user = User(
                username=username,
                email=email,
                password_hash=password_hash
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Seed 8 default trading rules for the new user (matches signup)
            default_rules = [
                ("Only trade during my planned session", "Session Rules"),
                ("Never move stop loss against my position", "Risk Rules"),
                ("Wait for market structure shift confirmation before entry", "Entry Rules"),
                ("Never risk more than 1% per trade", "Risk Rules"),
                ("Do not trade after 2 consecutive losses in one session", "Mindset Rules"),
                ("Only take trades with minimum 3 confluences", "Entry Rules"),
                ("Always have a clear target before entering", "Exit Rules"),
                ("Do not trade during high-impact news events", "Session Rules"),
            ]
            for text, cat in default_rules:
                rule = Rule(user_id=user.id, rule_text=text, category=cat, is_active=True)
                db.add(rule)
            db.commit()
            
        # Generate token
        token = create_token({"sub": user.username})
        return {"access_token": token, "token_type": "bearer", "username": user.username}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

# ── Forgot Password (OTP Flow) ─────────────

@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    """Step 1: Accept email, generate OTP, send via email."""
    from email_service import send_otp_email

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    otp_code = generate_otp()
    otp_expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

    user.otp_code = otp_code
    user.otp_expires_at = otp_expires
    db.commit()

    email_sent = send_otp_email(to_email=user.email, otp_code=otp_code)
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again later.")

    return {"message": "OTP sent to your email"}

@router.post("/verify-otp")
def verify_otp_endpoint(data: VerifyOtp, db: Session = Depends(get_db)):
    """Step 2: Verify OTP, return a one-time reset token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP requested. Please request a new one.")

    if datetime.datetime.utcnow() > user.otp_expires_at:
        user.otp_code = None
        user.otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if not verify_otp_safe(user.otp_code, data.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    # OTP is valid — clear it (single-use) and issue a reset token
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    # Create a short-lived reset token (10 minutes)
    reset_token = jwt.encode(
        {"sub": user.email, "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=10), "type": "reset"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"reset_token": reset_token}

@router.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    """Step 3: Use reset token to set a new password."""
    try:
        payload = jwt.decode(data.reset_token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Password reset successful"}
