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

class GoogleLoginRequest(BaseModel):
    credential: str

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
    category: Optional[str] = "General"
    is_active: Optional[bool] = True

class RuleUpdate(BaseModel):
    rule_text: Optional[str] = None
    category: Optional[str] = None
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
    pair_instrument: str
    date: str  # YYYY-MM-DD
    market: str = "Crypto"
    direction: str  # Long/Short
    session: Optional[str] = ""
    setup_type: Optional[str] = ""
    confluences: Optional[List[str]] = []
    mistakes: Optional[List[str]] = []
    pnl_usd: Optional[float] = 0.0
    fee_usd: Optional[float] = 0.0
    net_pnl_usd: Optional[float] = 0.0
    net_daily_amount_usd: Optional[float] = 0.0
    outcome: Optional[str] = "Breakeven"
    screenshot_url: Optional[str] = ""
    notes: Optional[str] = ""
    trade_quality: Optional[str] = ""
    planned_rr: Optional[float] = 0.0
    actual_rr: Optional[float] = 0.0
    emotion_before: Optional[str] = "Neutral"
    emotion_after: Optional[str] = "Neutral"

class JournalTradeUpdate(BaseModel):
    pair_instrument: Optional[str] = None
    date: Optional[str] = None
    market: Optional[str] = None
    direction: Optional[str] = None
    session: Optional[str] = None
    setup_type: Optional[str] = None
    confluences: Optional[List[str]] = None
    mistakes: Optional[List[str]] = None
    pnl_usd: Optional[float] = None
    fee_usd: Optional[float] = None
    net_pnl_usd: Optional[float] = None
    net_daily_amount_usd: Optional[float] = None
    outcome: Optional[str] = None
    screenshot_url: Optional[str] = None
    notes: Optional[str] = None
    trade_quality: Optional[str] = None
    planned_rr: Optional[float] = None
    actual_rr: Optional[float] = None
    emotion_before: Optional[str] = None
    emotion_after: Optional[str] = None

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
    date: str  # YYYY-MM-DD
    pre_market_note: Optional[str] = ""
    post_session_note: Optional[str] = ""
    bias: Optional[str] = ""
    key_levels: Optional[str] = ""
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
    week_start: str  # YYYY-MM-DD
    pnl_target: Optional[float] = 0.0
    win_rate_target: Optional[float] = 0.0
    max_mistakes: Optional[int] = 0
    notes: Optional[str] = ""

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
    date: str  # YYYY-MM-DD
    balance: float
    notes: Optional[str] = ""

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
    date: str  # YYYY-MM-DD
    time: Optional[str] = ""
    title: str
    category: Optional[str] = ""
    impact: Optional[str] = ""
    actual: Optional[str] = ""
    forecast: Optional[str] = ""
    previous: Optional[str] = ""
    notes: Optional[str] = ""

class MarketEventUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    impact: Optional[str] = None
    actual: Optional[str] = None
    forecast: Optional[str] = None
    previous: Optional[str] = None
    notes: Optional[str] = None

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
    date: str  # YYYY-MM-DD
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
