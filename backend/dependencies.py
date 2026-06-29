import os
from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt
from jose.exceptions import JWTError
from database import get_db
from models import User

security = HTTPBearer()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "behavioredge-super-secret-key-2026")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        # Supabase JWT tokens are HS256 signed with the project JWT Secret
        # The audience is usually 'authenticated'
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
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
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
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
