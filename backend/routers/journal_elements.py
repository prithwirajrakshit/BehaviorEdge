from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import (
    User,
    JournalDailyNote,
    JournalWeeklyGoal,
    JournalAccountBalance,
    JournalMarketEvent,
    JournalRuleCheck,
    JournalTrade,
    Rule
)
from schemas import (
    DailyNoteUpsert,
    DailyNoteOut,
    WeeklyGoalUpsert,
    WeeklyGoalOut,
    AccountBalanceCreate,
    AccountBalanceOut,
    MarketEventCreate,
    MarketEventUpdate,
    MarketEventOut,
    RuleCheckBulk,
    RuleCheckOut
)
from routers.auth import get_current_user
from typing import List, Optional
import datetime

router = APIRouter(prefix="/journal", tags=["Journal Elements"])

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

# ── Daily Notes ───────────────────────────────────────────────

@router.get("/daily_notes", response_model=List[DailyNoteOut])
def get_daily_notes(date: Optional[str] = None, user: User = Depends(get_user), db: Session = Depends(get_db)):
    if date:
        note = db.query(JournalDailyNote).filter(JournalDailyNote.user_id == user.id, JournalDailyNote.date == date).first()
        return [note] if note else []
    return db.query(JournalDailyNote).filter(JournalDailyNote.user_id == user.id).order_by(JournalDailyNote.date.desc()).all()

@router.post("/daily_notes", response_model=DailyNoteOut)
def upsert_daily_note(data: DailyNoteUpsert, user: User = Depends(get_user), db: Session = Depends(get_db)):
    note = db.query(JournalDailyNote).filter(JournalDailyNote.user_id == user.id, JournalDailyNote.date == data.date).first()
    if note:
        note.pre_market_note = data.pre_market_note or ""
        note.post_session_note = data.post_session_note or ""
        note.bias = data.bias or ""
        note.key_levels = data.key_levels or ""
        note.discipline_score = data.discipline_score or 0
    else:
        note = JournalDailyNote(
            user_id=user.id,
            date=data.date,
            pre_market_note=data.pre_market_note or "",
            post_session_note=data.post_session_note or "",
            bias=data.bias or "",
            key_levels=data.key_levels or "",
            discipline_score=data.discipline_score or 0
        )
        db.add(note)
    db.commit()
    db.refresh(note)
    return note

# ── Weekly Goals ──────────────────────────────────────────────

@router.get("/weekly_goals", response_model=List[WeeklyGoalOut])
def get_weekly_goals(week_start: Optional[str] = None, user: User = Depends(get_user), db: Session = Depends(get_db)):
    if week_start:
        goal = db.query(JournalWeeklyGoal).filter(JournalWeeklyGoal.user_id == user.id, JournalWeeklyGoal.week_start == week_start).first()
        return [goal] if goal else []
    return db.query(JournalWeeklyGoal).filter(JournalWeeklyGoal.user_id == user.id).order_by(JournalWeeklyGoal.week_start.desc()).all()

@router.post("/weekly_goals", response_model=WeeklyGoalOut)
def upsert_weekly_goal(data: WeeklyGoalUpsert, user: User = Depends(get_user), db: Session = Depends(get_db)):
    goal = db.query(JournalWeeklyGoal).filter(JournalWeeklyGoal.user_id == user.id, JournalWeeklyGoal.week_start == data.week_start).first()
    if goal:
        goal.pnl_target = data.pnl_target or 0.0
        goal.win_rate_target = data.win_rate_target or 0.0
        goal.max_mistakes = data.max_mistakes or 0
        goal.notes = data.notes or ""
    else:
        goal = JournalWeeklyGoal(
            user_id=user.id,
            week_start=data.week_start,
            pnl_target=data.pnl_target or 0.0,
            win_rate_target=data.win_rate_target or 0.0,
            max_mistakes=data.max_mistakes or 0,
            notes=data.notes or ""
        )
        db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

# ── Account Balances ──────────────────────────────────────────

@router.get("/account_balance", response_model=List[AccountBalanceOut])
def get_account_balances(user: User = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(JournalAccountBalance).filter(JournalAccountBalance.user_id == user.id).order_by(JournalAccountBalance.date.asc(), JournalAccountBalance.id.asc()).all()

@router.post("/account_balance", response_model=AccountBalanceOut)
def create_account_balance(data: AccountBalanceCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    balance = JournalAccountBalance(
        user_id=user.id,
        date=data.date,
        balance=data.balance,
        notes=data.notes or ""
    )
    db.add(balance)
    db.commit()
    db.refresh(balance)
    return balance

@router.delete("/account_balance/{balance_id}")
def delete_account_balance(balance_id: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    balance = db.query(JournalAccountBalance).filter(JournalAccountBalance.id == balance_id, JournalAccountBalance.user_id == user.id).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Account balance entry not found")
    db.delete(balance)
    db.commit()
    return {"success": True, "message": "Account balance entry deleted successfully"}

# ── Market Events ─────────────────────────────────────────────

@router.get("/market_events", response_model=List[MarketEventOut])
def get_market_events(
    category: Optional[str] = None,
    impact: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    query = db.query(JournalMarketEvent).filter(JournalMarketEvent.user_id == user.id)
    if category:
        query = query.filter(JournalMarketEvent.category == category)
    if impact:
        query = query.filter(JournalMarketEvent.impact == impact)
    if date_from:
        query = query.filter(JournalMarketEvent.date >= date_from)
    if date_to:
        query = query.filter(JournalMarketEvent.date <= date_to)
        
    return query.order_by(JournalMarketEvent.date.desc(), JournalMarketEvent.time.desc()).all()

@router.post("/market_events", response_model=MarketEventOut)
def create_market_event(data: MarketEventCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    # Duplicate check: skip if same date + title already exists for this user
    duplicate = db.query(JournalMarketEvent).filter(
        JournalMarketEvent.user_id == user.id,
        JournalMarketEvent.date == data.date,
        JournalMarketEvent.title == data.title
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Duplicate event already exists.")

    event = JournalMarketEvent(
        user_id=user.id,
        date=data.date,
        time=data.time or "",
        title=data.title,
        category=data.category or "",
        impact=data.impact or "",
        actual=data.actual or "",
        forecast=data.forecast or "",
        previous=data.previous or "",
        notes=data.notes or ""
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/market_events/{event_id}", response_model=MarketEventOut)
def update_market_event(event_id: int, data: MarketEventUpdate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    event = db.query(JournalMarketEvent).filter(JournalMarketEvent.id == event_id, JournalMarketEvent.user_id == user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Market event not found.")
        
    if data.date is not None:
        event.date = data.date
    if data.time is not None:
        event.time = data.time or ""
    if data.title is not None:
        event.title = data.title
    if data.category is not None:
        event.category = data.category or ""
    if data.impact is not None:
        event.impact = data.impact or ""
    if data.actual is not None:
        event.actual = data.actual or ""
    if data.forecast is not None:
        event.forecast = data.forecast or ""
    if data.previous is not None:
        event.previous = data.previous or ""
    if data.notes is not None:
        event.notes = data.notes or ""

    db.commit()
    db.refresh(event)
    return event

@router.delete("/market_events/{event_id}")
def delete_market_event(event_id: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    event = db.query(JournalMarketEvent).filter(JournalMarketEvent.id == event_id, JournalMarketEvent.user_id == user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Market event not found.")
    db.delete(event)
    db.commit()
    return {"success": True, "message": "Event deleted successfully."}

@router.delete("/market_events")
def clear_market_events(user: User = Depends(get_user), db: Session = Depends(get_db)):
    db.query(JournalMarketEvent).filter(JournalMarketEvent.user_id == user.id).delete()
    db.commit()
    return {"success": True, "message": "All market events cleared successfully."}

# ── Bulk Rule Checks Audits ───────────────────────────────────

@router.get("/rule_checks", response_model=List[RuleCheckOut])
def get_rule_checks(user: User = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(JournalRuleCheck).join(JournalTrade).filter(JournalTrade.user_id == user.id).order_by(JournalRuleCheck.created_at.desc()).all()

@router.post("/rule_checks/bulk")
def bulk_rule_checks(data: RuleCheckBulk, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trade = db.query(JournalTrade).filter(JournalTrade.id == data.trade_id, JournalTrade.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found.")

    followed = 0
    broken = 0

    # Clean previous checks for this trade to prevent duplicates on re-submission
    db.query(JournalRuleCheck).filter(JournalRuleCheck.trade_id == data.trade_id).delete()

    for check in data.checks:
        # Verify rule belongs to user and is active
        rule = db.query(Rule).filter(Rule.id == check.rule_id, Rule.user_id == user.id).first()
        if not rule:
            continue

        rule_check = JournalRuleCheck(
            trade_id=data.trade_id,
            rule_id=check.rule_id,
            was_followed=check.was_followed,
            date=data.date
        )
        db.add(rule_check)

        # Update metrics on the rule itself
        rule.times_checked += 1
        if not check.was_followed:
            broken += 1
            rule.times_broken += 1
        else:
            followed += 1

    # Update trade compliance scores
    trade.rules_followed_count = followed
    trade.rules_broken_count = broken

    db.commit()

    return {"success": True, "followed": followed, "broken": broken}
