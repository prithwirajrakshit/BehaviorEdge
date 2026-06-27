from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models import Trade, User
from schemas import TradeCreate, TradeOut
from routers.auth import get_current_user
from scoring import compute_discipline_score, calculate_rdi, calculate_evi, detect_biases, check_consecutive_losses
from typing import List
import datetime
import json

router = APIRouter(prefix="/trades", tags=["Trades"])

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

@router.post("/", response_model=TradeOut)
def log_trade(trade: TradeCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    # Fetch all past trades for this user
    past_trades = db.query(Trade).filter(
        Trade.user_id == user.id
    ).order_by(Trade.timestamp.asc()).all()

    # Build new_trade dict for scoring
    new_trade_dict = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "actual_risk": trade.actual_risk,
        "planned_risk": trade.planned_risk,
        "rule_followed": trade.rule_followed,
        "emotion_before": trade.emotion_before,
        "emotion_after": trade.emotion_after,
        "outcome": trade.outcome,
    }

    # ── Compute all scores in backend ──────────────────────────────
    rdi = calculate_rdi(trade.actual_risk, trade.planned_risk)
    evi = calculate_evi(trade.emotion_before, trade.emotion_after)
    discipline_score = compute_discipline_score(past_trades, new_trade_dict)
    biases = detect_biases(past_trades, new_trade_dict)
    consecutive_loss = check_consecutive_losses(past_trades)

    # ── Build violations list ──────────────────────────────────────
    violations = []
    if trade.actual_risk > trade.planned_risk:
        violations.append("Over-risking")
    if not trade.rule_followed:
        violations.append("Rule violation")
    if consecutive_loss:
        violations.append("Trading after 2 consecutive losses")
    for bias in biases:
        violations.append(bias)

    new_trade = Trade(
        user_id=user.id,
        capital=trade.capital,
        risk_percent=trade.risk_percent,
        planned_risk=trade.planned_risk,
        actual_risk=trade.actual_risk,
        emotion_before=trade.emotion_before,
        emotion_after=trade.emotion_after,
        rule_followed=trade.rule_followed,
        outcome=trade.outcome,
        pnl_amount=trade.pnl_amount,
        rdi=round(rdi, 3),
        evi=round(evi, 2),
        discipline_score=discipline_score,
        daily_loss=trade.daily_loss,
        violations=json.dumps(violations),
        pre_trade_approved=trade.pre_trade_approved
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)

    # ── Automatically populate corresponding JournalTrade entry ─────
    try:
        from models import JournalTrade
        outcome_str = trade.outcome.capitalize() if trade.outcome else "Breakeven"
        new_jt = JournalTrade(
            user_id=user.id,
            pair_instrument="Logged Trade",
            date=new_trade.timestamp.strftime("%Y-%m-%d"),
            market="Crypto",
            direction="Long",
            session="",
            setup_type="Gate Logged",
            confluences="[]",
            mistakes="[]",
            pnl_usd=trade.pnl_amount,
            fee_usd=0.0,
            net_pnl_usd=trade.pnl_amount,
            net_daily_amount_usd=trade.pnl_amount,
            outcome=outcome_str,
            screenshot_url="",
            notes=f"Logged from Pre-trade Gate. Emotion Before: {trade.emotion_before}, Emotion After: {trade.emotion_after}.",
            trade_quality="3",
            planned_rr=0.0,
            actual_rr=0.0,
            rules_followed_count=1 if trade.rule_followed else 0,
            rules_broken_count=0 if trade.rule_followed else 1
        )
        db.add(new_jt)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to auto-populate JournalTrade: {e}")

    return new_trade

@router.get("/", response_model=List[TradeOut])
def get_trades(limit: int = 100, user: User = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(Trade).filter(
        Trade.user_id == user.id
    ).order_by(Trade.timestamp.asc()).limit(limit).all()

@router.get("/today", response_model=List[TradeOut])
def get_today_trades(user: User = Depends(get_user), db: Session = Depends(get_db)):
    today = datetime.datetime.utcnow().date()
    return db.query(Trade).filter(
        Trade.user_id == user.id,
        Trade.timestamp >= today
    ).order_by(Trade.timestamp.asc()).all()

@router.delete("/{trade_id}")
def delete_trade(trade_id: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted"}
