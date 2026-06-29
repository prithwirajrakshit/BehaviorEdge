from pydantic import BaseModel, EmailStr, Field, AfterValidator
from typing import Optional, List, Annotated
from datetime import datetime
import re
import html

# Custom string sanitizers to block XSS and SQL injection
def clean_string(v: str) -> str:
    if not isinstance(v, str):
        return v
    # Strip HTML/script tags
    v = re.sub(r'<[^>]*>', '', v)
    # Escape HTML special characters
    v = html.escape(v)
    return v.strip()

# Strict type definitions with validation rules
SanitizedStr = Annotated[str, Field(max_length=2000), AfterValidator(clean_string)]
ShortStr = Annotated[str, Field(max_length=150), AfterValidator(clean_string)]

# ── Auth ──────────────────────────────────
class UserCreate(BaseModel):
    username: ShortStr
    email: EmailStr
    password: ShortStr

class UserLogin(BaseModel):
    username: ShortStr
    password: ShortStr

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleLoginRequest(BaseModel):
    credential: str

# ── User Identity ─────────────────────────
class UserIdentityUpdate(BaseModel):
    full_name: Optional[ShortStr] = None
    bio: Optional[SanitizedStr] = None
    location: Optional[ShortStr] = None
    website: Optional[ShortStr] = None
    twitter: Optional[ShortStr] = None
    experience_level: Optional[ShortStr] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: ShortStr
    new_password: ShortStr

# ── Forgot Password (OTP Flow) ────────────
class ForgotPassword(BaseModel):
    email: EmailStr

class VerifyOtp(BaseModel):
    email: EmailStr
    otp: ShortStr

class ResetPassword(BaseModel):
    reset_token: str
    new_password: ShortStr

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
    trading_style: ShortStr

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
    emotion_before: ShortStr
    emotion_after: ShortStr
    rule_followed: bool
    outcome: ShortStr
    pnl_amount: float
    rdi: float
    evi: float
    discipline_score: float
    daily_loss: float
    violations: SanitizedStr
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
    role: ShortStr
    content: SanitizedStr

class ChatMessageOut(BaseModel):
    id: int
    timestamp: datetime
    role: str
    content: str

    class Config:
        from_attributes = True

# ── Rules ─────────────────────────────────
class RuleCreate(BaseModel):
    rule_text: SanitizedStr
    category: Optional[ShortStr] = "General"
    is_active: Optional[bool] = True

class RuleUpdate(BaseModel):
    rule_text: Optional[SanitizedStr] = None
    category: Optional[ShortStr] = None
    is_active: Optional[bool] = None

class RuleOut(BaseModel):
    id: int
    rule_text: str
    category: str
    is_active: bool
    times_checked: int
    times_broken: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Journal Trades ────────────────────────
class JournalTradeCreate(BaseModel):
    pair_instrument: ShortStr
    date: ShortStr  # YYYY-MM-DD
    market: ShortStr = "Crypto"
    direction: ShortStr  # Long/Short
    session: Optional[ShortStr] = ""
    setup_type: Optional[ShortStr] = ""
    confluences: Optional[List[ShortStr]] = []
    mistakes: Optional[List[ShortStr]] = []
    pnl_usd: Optional[float] = 0.0
    fee_usd: Optional[float] = 0.0
    net_pnl_usd: Optional[float] = 0.0
    net_daily_amount_usd: Optional[float] = 0.0
    outcome: Optional[ShortStr] = "Breakeven"
    screenshot_url: Optional[ShortStr] = ""
    notes: Optional[SanitizedStr] = ""
    trade_quality: Optional[ShortStr] = ""
    planned_rr: Optional[float] = 0.0
    actual_rr: Optional[float] = 0.0
    emotion_before: Optional[ShortStr] = "Neutral"
    emotion_after: Optional[ShortStr] = "Neutral"

class JournalTradeUpdate(BaseModel):
    pair_instrument: Optional[ShortStr] = None
    date: Optional[ShortStr] = None
    market: Optional[ShortStr] = None
    direction: Optional[ShortStr] = None
    session: Optional[ShortStr] = None
    setup_type: Optional[ShortStr] = None
    confluences: Optional[List[ShortStr]] = None
    mistakes: Optional[List[ShortStr]] = None
    pnl_usd: Optional[float] = None
    fee_usd: Optional[float] = None
    net_pnl_usd: Optional[float] = None
    net_daily_amount_usd: Optional[float] = None
    outcome: Optional[ShortStr] = None
    screenshot_url: Optional[ShortStr] = None
    notes: Optional[SanitizedStr] = None
    trade_quality: Optional[ShortStr] = None
    planned_rr: Optional[float] = None
    actual_rr: Optional[float] = None
    emotion_before: Optional[ShortStr] = None
    emotion_after: Optional[ShortStr] = None

class JournalTradeOut(BaseModel):
    id: int
    pair_instrument: str
    date: str
    market: str
    direction: str
    session: str
    setup_type: str
    confluences: List[str]
    mistakes: List[str]
    pnl_usd: float
    fee_usd: float
    net_pnl_usd: float
    net_daily_amount_usd: float
    outcome: str
    screenshot_url: str
    notes: str
    trade_quality: str
    planned_rr: float
    actual_rr: float
    rules_followed_count: int
    rules_broken_count: int
    emotion_before: str
    emotion_after: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Daily Notes ───────────────────────────
class DailyNoteUpsert(BaseModel):
    date: ShortStr  # YYYY-MM-DD
    pre_market_note: Optional[SanitizedStr] = ""
    post_session_note: Optional[SanitizedStr] = ""
    bias: Optional[ShortStr] = ""
    key_levels: Optional[SanitizedStr] = ""
    discipline_score: Optional[int] = 0

class DailyNoteOut(BaseModel):
    id: int
    date: str
    pre_market_note: str
    post_session_note: str
    bias: str
    key_levels: str
    discipline_score: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Weekly Goals ──────────────────────────
class WeeklyGoalUpsert(BaseModel):
    week_start: ShortStr  # YYYY-MM-DD
    pnl_target: Optional[float] = 0.0
    win_rate_target: Optional[float] = 0.0
    max_mistakes: Optional[int] = 0
    notes: Optional[SanitizedStr] = ""

class WeeklyGoalOut(BaseModel):
    id: int
    week_start: str
    pnl_target: float
    win_rate_target: float
    max_mistakes: int
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Account Balance ───────────────────────
class AccountBalanceCreate(BaseModel):
    date: ShortStr  # YYYY-MM-DD
    balance: float
    notes: Optional[SanitizedStr] = ""

class AccountBalanceOut(BaseModel):
    id: int
    date: str
    balance: float
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Market Events ─────────────────────────
class MarketEventCreate(BaseModel):
    date: ShortStr  # YYYY-MM-DD
    time: Optional[ShortStr] = ""
    title: ShortStr
    category: Optional[ShortStr] = ""
    impact: Optional[ShortStr] = ""
    actual: Optional[ShortStr] = ""
    forecast: Optional[ShortStr] = ""
    previous: Optional[ShortStr] = ""
    notes: Optional[SanitizedStr] = ""

class MarketEventUpdate(BaseModel):
    date: Optional[ShortStr] = None
    time: Optional[ShortStr] = None
    title: Optional[ShortStr] = None
    category: Optional[ShortStr] = None
    impact: Optional[ShortStr] = None
    actual: Optional[ShortStr] = None
    forecast: Optional[ShortStr] = None
    previous: Optional[ShortStr] = None
    notes: Optional[SanitizedStr] = None

class MarketEventOut(BaseModel):
    id: int
    date: str
    time: str
    title: str
    category: str
    impact: str
    actual: str
    forecast: str
    previous: str
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Rule Checks ───────────────────────────
class RuleCheckItem(BaseModel):
    rule_id: int
    was_followed: bool

class RuleCheckBulk(BaseModel):
    trade_id: int
    date: ShortStr  # YYYY-MM-DD
    checks: List[RuleCheckItem]

class RuleCheckOut(BaseModel):
    id: int
    trade_id: int
    rule_id: int
    was_followed: bool
    date: str
    created_at: datetime

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
