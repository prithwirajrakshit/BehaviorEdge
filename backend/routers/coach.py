from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
from models import ChatMessage, Trade, Profile, User
from schemas import ChatMessageCreate, ChatMessageOut
from routers.auth import get_current_user
from scoring import get_emotion_risk
from typing import List
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import datetime
import os

load_dotenv()

router = APIRouter(prefix="/coach", tags=["AI Coach"])

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

class PreTradeRequest(BaseModel):
    emotion: str
    confidence: int
    revenge_urge: bool
    setup_validated: bool

class PreTradeResponse(BaseModel):
    approved: bool
    block_reasons: List[str]
    ai_assessment: str

def build_system_prompt(trades, profile, mode="chat"):
    win_rate = (sum(1 for t in trades if t.outcome == "win") / len(trades) * 100) if trades else 0
    recent = trades[-5:] if len(trades) >= 5 else trades
    discipline_score = trades[-1].discipline_score if trades else 100

    prompt = f"""You are BehaviorEdge AI — a behavioral risk regulation coach for traders.
You ONLY help traders understand and correct psychological biases and risk management violations.
You NEVER give trading signals, price targets, or financial advice.

TRADER PROFILE:
- Capital: ${profile.capital if profile else 'N/A'}
- Risk per trade: {profile.risk_percent if profile else 'N/A'}%
- Max daily loss: ${profile.daily_max_loss if profile else 'N/A'}
- Style: {profile.trading_style if profile else 'N/A'}

CURRENT STATE:
- Discipline Score: {discipline_score}/100
- Total Trades: {len(trades)} | Win Rate: {win_rate:.1f}%

RECENT TRADES (last 5):"""

    for i, t in enumerate(recent):
        prompt += f"\n  Trade {i+1}: {t.outcome.upper()} | {t.emotion_before}→{t.emotion_after} | Rules: {t.rule_followed} | RDI: {t.rdi:.2f} | P&L: ${t.pnl_amount:.2f}"

    if mode == "pre_trade":
        prompt += "\n\nTrader is about to enter a trade. Assess their psychological readiness based on their current state and history. Be direct and specific. Max 120 words."
    elif mode == "post_trade":
        prompt += "\n\nTrader just completed a trade. Give specific behavioral feedback. Be firm but constructive. Max 120 words."
    else:
        prompt += "\n\nRespond as a behavioral coach. Stay focused on psychology and discipline. Never give trading signals. Be concise."

    return prompt

def get_gemini_response(system_prompt: str, user_message: str, history=None):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "AI Coach unavailable: No API key configured."

        client = genai.Client(api_key=api_key)
        contents = []
        if history:
            for msg in history[-6:]:
                role = "user" if msg.role == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part(text=msg.content)]))
        contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(system_instruction=system_prompt),
            contents=contents,
        )
        return response.text
    except Exception as e:
        return f"AI Coach unavailable: {str(e)}"

@router.post("/pre-trade", response_model=PreTradeResponse)
def pre_trade_check(data: PreTradeRequest, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).order_by(Trade.timestamp.asc()).all()
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    block_reasons = []

    # 1. Emotional state risk
    emotion_risk = get_emotion_risk(data.emotion)
    if emotion_risk in ["high", "very_high"]:
        block_reasons.append(f"Emotional state ({data.emotion}) is high risk")

    # 2. Revenge trading intent
    if data.revenge_urge:
        block_reasons.append("Revenge trading intent detected")

    # 3. Low confidence in setup
    if data.confidence < 4:
        block_reasons.append(f"Low setup confidence ({data.confidence}/10) — minimum is 4")

    # 4. Setup not validated
    if not data.setup_validated:
        block_reasons.append("Setup criteria not fully validated")

    # 5. Daily loss limit reached
    if profile and profile.daily_max_loss > 0:
        today = datetime.datetime.utcnow().date()
        today_trades = [t for t in trades if t.timestamp.date() == today]
        net_pnl = sum(t.pnl_amount for t in today_trades)
        effective_loss = max(0, -net_pnl)
        if effective_loss >= profile.daily_max_loss:
            block_reasons.append(f"Daily loss limit reached (${effective_loss:.2f} / ${profile.daily_max_loss:.2f})")

    # 6. Consecutive losses today
    today = datetime.datetime.utcnow().date()
    today_trades_list = [t for t in trades if t.timestamp.date() == today]
    if len(today_trades_list) >= 2 and all(t.outcome == "loss" for t in today_trades_list[-2:]):
        block_reasons.append("2 consecutive losses today — cooldown recommended")

    # Build AI message
    recent_outcomes = [t.outcome for t in trades[-3:]]
    recent_losses = recent_outcomes.count("loss")
    user_msg = (
        f"Pre-trade state: emotion={data.emotion}, confidence={data.confidence}/10, "
        f"setup_validated={data.setup_validated}, revenge_urge={data.revenge_urge}, "
        f"recent_losses_in_last_3_trades={recent_losses}. "
        f"Flags raised: {block_reasons if block_reasons else 'None'}. "
        f"Give a direct, focused readiness assessment."
    )

    system = build_system_prompt(trades, profile, mode="pre_trade")
    ai_assessment = get_gemini_response(system, user_msg)

    return PreTradeResponse(
        approved=len(block_reasons) == 0,
        block_reasons=block_reasons,
        ai_assessment=ai_assessment,
    )

@router.post("/chat", response_model=ChatMessageOut)
def chat(data: ChatMessageCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).order_by(Trade.timestamp.asc()).all()
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    history = db.query(ChatMessage).filter(ChatMessage.user_id == user.id).order_by(ChatMessage.id.desc()).limit(10).all()
    history = list(reversed(history))

    save_user_msg = ChatMessage(user_id=user.id, role="user", content=data.content)
    db.add(save_user_msg)
    db.commit()

    system = build_system_prompt(trades, profile, mode="chat")
    response_text = get_gemini_response(system, data.content, history)

    save_ai_msg = ChatMessage(user_id=user.id, role="assistant", content=response_text)
    db.add(save_ai_msg)
    db.commit()
    db.refresh(save_ai_msg)
    return save_ai_msg

@router.get("/history", response_model=List[ChatMessageOut])
def get_history(user: User = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id
    ).order_by(ChatMessage.timestamp.asc()).limit(50).all()

@router.delete("/history")
def clear_history(user: User = Depends(get_user), db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
