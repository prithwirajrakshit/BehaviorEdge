from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Extended user identity fields
    full_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    experience_level = Column(String, nullable=True, default="Intermediate")
    trades = relationship("Trade", back_populates="user")
    profile = relationship("Profile", back_populates="user", uselist=False)
    chat_history = relationship("ChatMessage", back_populates="user")

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
    rule_text = Column(Text)
