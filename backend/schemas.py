from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ── Auth ──────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ── User Identity ─────────────────────────
class UserIdentityUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    experience_level: Optional[str] = None
    email: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# ── Forgot Password (OTP Flow) ────────────
class ForgotPassword(BaseModel):
    email: str

class VerifyOtp(BaseModel):
    email: str
    otp: str

class ResetPassword(BaseModel):
    reset_token: str
    new_password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    twitter: Optional[str] = None
    experience_level: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ── Profile ───────────────────────────────
class ProfileCreate(BaseModel):
    capital: float
    risk_percent: float
    daily_max_loss: float
    trading_style: str

class ProfileOut(BaseModel):
    capital: float
    risk_percent: float
    daily_max_loss: float
    trading_style: str

    class Config:
        from_attributes = True

# ── Trades ────────────────────────────────
class TradeCreate(BaseModel):
    capital: float
    risk_percent: float
    planned_risk: float
    actual_risk: float
    emotion_before: str
    emotion_after: str
    rule_followed: bool
    outcome: str
    pnl_amount: float
    rdi: float
    evi: float
    discipline_score: float
    daily_loss: float
    violations: str
    pre_trade_approved: bool

class TradeOut(BaseModel):
    id: int
    timestamp: datetime
    capital: float
    risk_percent: float
    planned_risk: float
    actual_risk: float
    emotion_before: str
    emotion_after: str
    rule_followed: bool
    outcome: str
    pnl_amount: float
    rdi: float
    evi: float
    discipline_score: float
    daily_loss: float
    violations: str
    pre_trade_approved: bool

    class Config:
        from_attributes = True

# ── Chat ──────────────────────────────────
class ChatMessageCreate(BaseModel):
    role: str
    content: str

class ChatMessageOut(BaseModel):
    id: int
    timestamp: datetime
    role: str
    content: str

    class Config:
        from_attributes = True

# ── Rules ─────────────────────────────────
class RuleCreate(BaseModel):
    rule_text: str

class RuleOut(BaseModel):
    id: int
    rule_text: str

    class Config:
        from_attributes = True

# ── Dashboard ─────────────────────────────
class DashboardStats(BaseModel):
    total_trades: int
    win_rate: float
    avg_rdi: float
    avg_evi: float
    discipline_score: float
    net_pnl: float
    today_pnl: float
    today_trades: int
    daily_loss: float
