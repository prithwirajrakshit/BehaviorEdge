from fastapi import APIRouter, Depends, Header, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Profile, User
from schemas import ProfileCreate, ProfileOut, UserOut, UserIdentityUpdate, PasswordChange
from routers.auth import get_current_user, hash_password, verify_password
import base64
import os

router = APIRouter(prefix="/profile", tags=["Profile"])

AVATAR_DIR = "avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

# ── Get full profile (risk params + user identity) ────────────────────────────
@router.get("/", response_model=ProfileOut)
def get_profile(user: User = Depends(get_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id, capital=10000, risk_percent=1.0, daily_max_loss=300, trading_style="Day Trading")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.post("/", response_model=ProfileOut)
def save_profile(data: ProfileCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile:
        profile.capital = data.capital
        profile.risk_percent = data.risk_percent
        profile.daily_max_loss = data.daily_max_loss
        profile.trading_style = data.trading_style
    else:
        profile = Profile(user_id=user.id, capital=data.capital, risk_percent=data.risk_percent,
                          daily_max_loss=data.daily_max_loss, trading_style=data.trading_style)
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

# ── Get / update user identity ────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_user), db: Session = Depends(get_db)):
    return user

@router.put("/me", response_model=UserOut)
def update_me(data: UserIdentityUpdate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    if data.email and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    if data.full_name is not None: user.full_name = data.full_name
    if data.bio is not None: user.bio = data.bio
    if data.location is not None: user.location = data.location
    if data.website is not None: user.website = data.website
    if data.twitter is not None: user.twitter = data.twitter
    if data.experience_level is not None: user.experience_level = data.experience_level
    db.commit()
    db.refresh(user)
    return user

# ── Change password ───────────────────────────────────────────────────────────
@router.post("/change-password")
def change_password(data: PasswordChange, user: User = Depends(get_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

# ── Upload avatar ─────────────────────────────────────────────────────────────
@router.post("/avatar", response_model=UserOut)
async def upload_avatar(file: UploadFile = File(...), user: User = Depends(get_user), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    contents = await file.read()
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
    if ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
        ext = "png"

    filename = f"avatar_{user.id}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    user.avatar_url = f"/avatars/{filename}"
    db.commit()
    db.refresh(user)
    return user

# ── Delete avatar ─────────────────────────────────────────────────────────────
@router.delete("/avatar", response_model=UserOut)
def delete_avatar(user: User = Depends(get_user), db: Session = Depends(get_db)):
    if user.avatar_url:
        filepath = user.avatar_url.lstrip("/")
        if os.path.exists(filepath):
            os.remove(filepath)
    user.avatar_url = None
    db.commit()
    db.refresh(user)
    return user
