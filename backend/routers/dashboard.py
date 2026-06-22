from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
from models import Trade, User
from schemas import DashboardStats
from routers.auth import get_current_user
import datetime

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

@router.get("/stats", response_model=DashboardStats)
def get_stats(user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).all()
    today = datetime.datetime.utcnow().date()
    today_trades = [t for t in trades if t.timestamp.date() == today]

    total = len(trades)
    wins = sum(1 for t in trades if t.outcome == "win")
    win_rate = (wins / total * 100) if total else 0
    avg_rdi = sum(t.rdi for t in trades) / total if total else 0
    avg_evi = sum(t.evi for t in trades) / total if total else 0
    discipline_score = trades[-1].discipline_score if trades else 100
    net_pnl = sum(t.pnl_amount for t in trades)
    today_pnl = sum(t.pnl_amount for t in today_trades)
    daily_loss = sum(t.actual_risk for t in today_trades if t.outcome == "loss")

    return DashboardStats(
        total_trades=total,
        win_rate=round(win_rate, 2),
        avg_rdi=round(avg_rdi, 3),
        avg_evi=round(avg_evi, 3),
        discipline_score=round(discipline_score, 1),
        net_pnl=round(net_pnl, 2),
        today_pnl=round(today_pnl, 2),
        today_trades=len(today_trades),
        daily_loss=round(daily_loss, 2)
    )

@router.get("/calendar")
def get_calendar(year: int, month: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).all()
    day_data = {}

    for t in trades:
        if t.timestamp.year == year and t.timestamp.month == month:
            date_str = t.timestamp.strftime("%Y-%m-%d")
            if date_str not in day_data:
                day_data[date_str] = {"net_pnl": 0.0, "count": 0}
            day_data[date_str]["count"] += 1
            day_data[date_str]["net_pnl"] += t.pnl_amount

    return day_data

@router.get("/monthly-summary")
def get_monthly_summary(year: int, month: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).all()
    month_trades = [t for t in trades if t.timestamp.year == year and t.timestamp.month == month]

    if not month_trades:
        return {"message": "No trades this month"}

    day_pnls = {}
    for t in month_trades:
        date_str = t.timestamp.strftime("%Y-%m-%d")
        day_pnls[date_str] = day_pnls.get(date_str, 0) + t.pnl_amount

    profit_days = sum(1 for p in day_pnls.values() if p > 0)
    loss_days   = sum(1 for p in day_pnls.values() if p < 0)
    even_days   = sum(1 for p in day_pnls.values() if p == 0)
    month_net   = sum(day_pnls.values())

    return {
        "trading_days": len(day_pnls),
        "total_trades": len(month_trades),
        "profit_days": profit_days,
        "loss_days": loss_days,
        "even_days": even_days,
        "month_net_pnl": round(month_net, 2)
    }