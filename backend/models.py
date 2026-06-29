from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True)
    supabase_id = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Extended user identity fields
    full_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    experience_level = Column(String, nullable=True, default="Intermediate")
    # Password reset OTP
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    subscription_tier = Column(String, default="free")
    trades = relationship("Trade", back_populates="user")
    profile = relationship("Profile", back_populates="user", uselist=False)
    chat_history = relationship("ChatMessage", back_populates="user")
    
    # Journal-related relationships
    rules = relationship("Rule", back_populates="user", cascade="all, delete-orphan")
    journal_trades = relationship("JournalTrade", back_populates="user", cascade="all, delete-orphan")
    journal_daily_notes = relationship("JournalDailyNote", back_populates="user", cascade="all, delete-orphan")
    journal_weekly_goals = relationship("JournalWeeklyGoal", back_populates="user", cascade="all, delete-orphan")
    journal_account_balances = relationship("JournalAccountBalance", back_populates="user", cascade="all, delete-orphan")
    journal_market_events = relationship("JournalMarketEvent", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    capital = Column(Float, default=10000)
    risk_percent = Column(Float, default=1.0)
    daily_max_loss = Column(Float, default=300)
    trading_style = Column(String, default="Day Trading")
    user = relationship("User", back_populates="profile")

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    capital = Column(Float)
    risk_percent = Column(Float)
    planned_risk = Column(Float)
    actual_risk = Column(Float)
    emotion_before = Column(String)
    emotion_after = Column(String)
    rule_followed = Column(Boolean)
    outcome = Column(String)
    pnl_amount = Column(Float, default=0)
    rdi = Column(Float)
    evi = Column(Float)
    discipline_score = Column(Float)
    daily_loss = Column(Float)
    violations = Column(Text)
    pre_trade_approved = Column(Boolean)
    user = relationship("User", back_populates="trades")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    role = Column(String)
    content = Column(Text)
    user = relationship("User", back_populates="chat_history")

class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    rule_text = Column(Text, nullable=False)
    category = Column(String, default="General")
    is_active = Column(Boolean, default=True)
    times_checked = Column(Integer, default=0)
    times_broken = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="rules")

class JournalTrade(Base):
    __tablename__ = "journal_trades"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pair_instrument = Column(String, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    market = Column(String, default="Crypto")
    direction = Column(String, nullable=False)
    session = Column(String, default="")
    setup_type = Column(String, default="")
    confluences = Column(Text, default="[]")  # JSON array string
    mistakes = Column(Text, default="[]")      # JSON array string
    pnl_usd = Column(Float, default=0.0)
    fee_usd = Column(Float, default=0.0)
    net_pnl_usd = Column(Float, default=0.0)
    net_daily_amount_usd = Column(Float, default=0.0)
    outcome = Column(String, default="Breakeven")
    screenshot_url = Column(String, default="")
    notes = Column(Text, default="")
    trade_quality = Column(String, default="")
    planned_rr = Column(Float, default=0.0)
    actual_rr = Column(Float, default=0.0)
    rules_followed_count = Column(Integer, default=0)
    rules_broken_count = Column(Integer, default=0)
    emotion_before = Column(String, default="Neutral")
    emotion_after = Column(String, default="Neutral")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journal_trades")
    rule_checks = relationship("JournalRuleCheck", back_populates="trade", cascade="all, delete-orphan")

class JournalDailyNote(Base):
    __tablename__ = "journal_daily_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, nullable=False)  # YYYY-MM-DD
    pre_market_note = Column(Text, default="")
    post_session_note = Column(Text, default="")
    bias = Column(String, default="")
    key_levels = Column(Text, default="")
    discipline_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journal_daily_notes")
    
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_daily_note_date_uc'),)

class JournalWeeklyGoal(Base):
    __tablename__ = "journal_weekly_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    week_start = Column(String, nullable=False)  # YYYY-MM-DD
    pnl_target = Column(Float, default=0.0)
    win_rate_target = Column(Float, default=0.0)
    max_mistakes = Column(Integer, default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journal_weekly_goals")
    
    __table_args__ = (UniqueConstraint('user_id', 'week_start', name='_user_weekly_goal_week_uc'),)

class JournalAccountBalance(Base):
    __tablename__ = "journal_account_balances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, nullable=False)  # YYYY-MM-DD
    balance = Column(Float, nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journal_account_balances")

class JournalMarketEvent(Base):
    __tablename__ = "journal_market_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, nullable=False)  # YYYY-MM-DD
    time = Column(String, default="")
    title = Column(String, nullable=False)
    category = Column(String, default="")
    impact = Column(String, default="")
    actual = Column(String, default="")
    forecast = Column(String, default="")
    previous = Column(String, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journal_market_events")

class JournalRuleCheck(Base):
    __tablename__ = "journal_rule_checks"
    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("journal_trades.id", ondelete="CASCADE"))
    rule_id = Column(Integer, ForeignKey("rules.id", ondelete="CASCADE"))
    was_followed = Column(Boolean, default=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trade = relationship("JournalTrade", back_populates="rule_checks")
    rule = relationship("Rule")

class ProcessedEvent(Base):
    __tablename__ = "processed_events"
    event_id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

