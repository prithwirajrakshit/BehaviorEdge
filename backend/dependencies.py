import os
from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt
from jose.exceptions import JWTError
from database import get_db
from models import User

security = HTTPBearer()

import time
import httpx

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "behavioredge-super-secret-key-2026")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ltipnuvqntfgoixdahgy.supabase.co")

JWKS_CACHE = None
JWKS_LAST_FETCH = 0

def decode_supabase_token(token: str) -> dict:
    global JWKS_CACHE, JWKS_LAST_FETCH
    
    try:
        headers = jwt.get_unverified_header(token)
        token_alg = headers.get("alg")
    except Exception as e:
        raise Exception(f"Invalid token format: {str(e)}")

    # If it is a symmetric HS256 token, bypass JWKS and decode with local secret key
    if token_alg == "HS256":
        return jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")

    # 1. Try decoding with JWKs (supports ES256, RS256, etc.)
    try:
        current_time = time.time()
        if not JWKS_CACHE or (current_time - JWKS_LAST_FETCH > 1800): # cache for 30 mins
            jwks_url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            supabase_anon = os.getenv("SUPABASE_ANON_KEY", token)
            req_headers = {"apikey": supabase_anon}
            r = httpx.get(jwks_url, headers=req_headers, timeout=5.0)
            if r.status_code == 200:
                JWKS_CACHE = r.json()
                JWKS_LAST_FETCH = current_time
            else:
                # Fallback to fetch without headers since /.well-known/jwks.json is public
                r = httpx.get(jwks_url, timeout=5.0)
                if r.status_code == 200:
                    JWKS_CACHE = r.json()
                    JWKS_LAST_FETCH = current_time
        
        if JWKS_CACHE:
            kid = headers.get("kid")
            
            # Find the matching key in the JWKS keys list
            matching_key = None
            for key in JWKS_CACHE.get("keys", []):
                if key.get("kid") == kid:
                    matching_key = key
                    break
            
            if matching_key:
                alg = matching_key.get("alg", token_alg)
                return jwt.decode(token, matching_key, algorithms=[alg], audience="authenticated")
            else:
                raise Exception(f"No matching key found in JWKS for kid: {kid}")
        else:
            raise Exception("JWKS cache could not be loaded")
    except Exception as e:
        raise Exception(f"JWK decode failed: {str(e)}")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = decode_supabase_token(token)
        supabase_id = payload.get("sub")
        if not supabase_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
            
        # Get user from local database by supabase_id (external UUID)
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
            
            # Seed 8 default trading rules for the user (standard platform onboarding)
            from models import Rule
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth error (deps): {str(e)}"
        )

# Reusable IDOR protection dependency
def verify_owner(model):
    def dependency(
        id: int = Path(..., description="ID of the resource to access"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ):
        resource = db.query(model).filter(model.id == id).first()
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
            
        # Verify authenticated user's ID matches owner_id or user_id
        owner_id = getattr(resource, "user_id", None) or getattr(resource, "owner_id", None)
        if owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this resource"
            )
        return resource
    return dependency
