from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, JournalTrade, JournalRuleCheck, Rule
from schemas import (
    JournalTradeCreate,
    JournalTradeUpdate,
    JournalTradeOut
)
from routers.auth import get_current_user
from typing import List, Optional
import json
import datetime

router = APIRouter(prefix="/journal", tags=["Journal Trades"])

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

def format_trade_out(trade: JournalTrade) -> dict:
    try:
        confluences_list = json.loads(trade.confluences or "[]")
    except Exception:
        confluences_list = []
        
    try:
        mistakes_list = json.loads(trade.mistakes or "[]")
    except Exception:
        mistakes_list = []

    return {
        "id": trade.id,
        "pair_instrument": trade.pair_instrument,
        "date": trade.date,
        "market": trade.market,
        "direction": trade.direction,
        "session": trade.session,
        "setup_type": trade.setup_type,
        "confluences": confluences_list,
        "mistakes": mistakes_list,
        "pnl_usd": trade.pnl_usd,
        "fee_usd": trade.fee_usd,
        "net_pnl_usd": trade.net_pnl_usd,
        "net_daily_amount_usd": trade.net_daily_amount_usd,
        "outcome": trade.outcome,
        "screenshot_url": trade.screenshot_url,
        "notes": trade.notes,
        "trade_quality": trade.trade_quality,
        "planned_rr": trade.planned_rr,
        "actual_rr": trade.actual_rr,
        "rules_followed_count": trade.rules_followed_count,
        "rules_broken_count": trade.rules_broken_count,
        "created_at": trade.created_at,
    }

# ── Trades CRUD ───────────────────────────────────────────────

@router.get("/trades", response_model=List[JournalTradeOut])
def get_trades(
    outcome: Optional[str] = None,
    session: Optional[str] = None,
    setup_type: Optional[str] = None,
    direction: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: User = Depends(get_user),
    db: Session = Depends(get_db)
):
    query = db.query(JournalTrade).filter(JournalTrade.user_id == user.id)
    if outcome:
        query = query.filter(JournalTrade.outcome == outcome)
    if session:
        query = query.filter(JournalTrade.session == session)
    if setup_type:
        query = query.filter(JournalTrade.setup_type == setup_type)
    if direction:
        query = query.filter(JournalTrade.direction == direction)
    if date_from:
        query = query.filter(JournalTrade.date >= date_from)
    if date_to:
        query = query.filter(JournalTrade.date <= date_to)
    
    trades = query.order_by(JournalTrade.date.desc(), JournalTrade.id.desc()).all()
    return [format_trade_out(t) for t in trades]

@router.get("/trades/{trade_id}", response_model=JournalTradeOut)
def get_trade(trade_id: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trade = db.query(JournalTrade).filter(JournalTrade.id == trade_id, JournalTrade.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return format_trade_out(trade)

@router.post("/trades", response_model=JournalTradeOut)
def create_trade(data: JournalTradeCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    pnl_usd = data.pnl_usd or 0.0
    fee_usd = data.fee_usd or 0.0
    net_pnl_usd = data.net_pnl_usd if data.net_pnl_usd is not None else (pnl_usd + fee_usd)

    confluences_str = json.dumps(data.confluences or [])
    mistakes_str = json.dumps(data.mistakes or [])

    trade = JournalTrade(
        user_id=user.id,
        pair_instrument=data.pair_instrument.strip().upper() if data.pair_instrument else "",
        date=data.date,
        market=data.market,
        direction=data.direction,
        session=data.session or "",
        setup_type=data.setup_type or "",
        confluences=confluences_str,
        mistakes=mistakes_str,
        pnl_usd=pnl_usd,
        fee_usd=fee_usd,
        net_pnl_usd=net_pnl_usd,
        net_daily_amount_usd=data.net_daily_amount_usd or 0.0,
        outcome=data.outcome or "Breakeven",
        screenshot_url=data.screenshot_url or "",
        notes=data.notes or "",
        trade_quality=data.trade_quality or "",
        planned_rr=data.planned_rr or 0.0,
        actual_rr=data.actual_rr or 0.0
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return format_trade_out(trade)

@router.put("/trades/{trade_id}", response_model=JournalTradeOut)
def update_trade(trade_id: int, data: JournalTradeUpdate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trade = db.query(JournalTrade).filter(JournalTrade.id == trade_id, JournalTrade.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    if data.pair_instrument is not None:
        trade.pair_instrument = data.pair_instrument.strip().upper()
    if data.date is not None:
        trade.date = data.date
    if data.market is not None:
        trade.market = data.market
    if data.direction is not None:
        trade.direction = data.direction
    if data.session is not None:
        trade.session = data.session or ""
    if data.setup_type is not None:
        trade.setup_type = data.setup_type or ""
    if data.confluences is not None:
        trade.confluences = json.dumps(data.confluences)
    if data.mistakes is not None:
        trade.mistakes = json.dumps(data.mistakes)
    if data.pnl_usd is not None:
        trade.pnl_usd = data.pnl_usd
    if data.fee_usd is not None:
        trade.fee_usd = data.fee_usd
    
    # Recalculate net_pnl_usd if pnl or fee updated
    if data.pnl_usd is not None or data.fee_usd is not None:
        trade.net_pnl_usd = (data.pnl_usd if data.pnl_usd is not None else trade.pnl_usd) + (data.fee_usd if data.fee_usd is not None else trade.fee_usd)
    if data.net_pnl_usd is not None:
        trade.net_pnl_usd = data.net_pnl_usd
        
    if data.net_daily_amount_usd is not None:
        trade.net_daily_amount_usd = data.net_daily_amount_usd
    if data.outcome is not None:
        trade.outcome = data.outcome
    if data.screenshot_url is not None:
        trade.screenshot_url = data.screenshot_url or ""
    if data.notes is not None:
        trade.notes = data.notes or ""
    if data.trade_quality is not None:
        trade.trade_quality = data.trade_quality or ""
    if data.planned_rr is not None:
        trade.planned_rr = data.planned_rr
    if data.actual_rr is not None:
        trade.actual_rr = data.actual_rr

    db.commit()
    db.refresh(trade)
    return format_trade_out(trade)

@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    trade = db.query(JournalTrade).filter(JournalTrade.id == trade_id, JournalTrade.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"success": True, "message": "Trade deleted successfully"}

@router.delete("/trades")
def clear_trades(user: User = Depends(get_user), db: Session = Depends(get_db)):
    db.query(JournalTrade).filter(JournalTrade.user_id == user.id).delete()
    db.commit()
    return {"success": True, "message": "All trades cleared successfully"}

# ── Analytics & Charts ────────────────────────────────────────

@router.get("/analytics/summary")
def get_analytics_summary(user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(JournalTrade).filter(JournalTrade.user_id == user.id).all()
    total_trades = len(trades)
    total_net_pnl = 0.0
    wins = 0
    losses = 0
    total_fees = 0.0
    win_sum = 0.0
    loss_sum = 0.0
    best_trade = 0.0
    worst_trade = 0.0

    for t in trades:
        total_net_pnl += t.net_pnl_usd
        total_fees += abs(t.fee_usd)

        if t.outcome == 'Win':
            wins += 1
            win_sum += t.net_pnl_usd
        elif t.outcome == 'Loss':
            losses += 1
            loss_sum += t.net_pnl_usd

        if t.net_pnl_usd > best_trade:
            best_trade = t.net_pnl_usd
        if t.net_pnl_usd < worst_trade:
            worst_trade = t.net_pnl_usd

    win_rate = (wins / (wins + losses) * 100.0) if (wins + losses) > 0 else 0.0
    profit_factor = win_sum / abs(loss_sum) if abs(loss_sum) > 0 else (win_sum if win_sum > 0 else 0.0)
    average_win = (win_sum / wins) if wins > 0 else 0.0
    average_loss = (loss_sum / losses) if losses > 0 else 0.0

    return {
        "totalNetPnl": round(total_net_pnl, 2),
        "winRate": round(win_rate, 2),
        "totalTrades": total_trades,
        "profitFactor": round(profit_factor, 2),
        "averageWin": round(average_win, 2),
        "averageLoss": round(average_loss, 2),
        "bestTrade": round(best_trade, 2),
        "worstTrade": round(worst_trade, 2),
        "totalFees": round(total_fees, 2)
    }

@router.get("/analytics/charts")
def get_analytics_charts(user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(JournalTrade).filter(JournalTrade.user_id == user.id).order_by(JournalTrade.date.asc(), JournalTrade.id.asc()).all()

    # 1. Cumulative PnL Curve & Daily PnL Bar Chart
    daily_pnl_map = {}
    for t in trades:
        daily_pnl_map[t.date] = daily_pnl_map.get(t.date, 0.0) + t.net_pnl_usd

    unique_dates = sorted(daily_pnl_map.keys())
    pnl_cum = 0.0
    cumulative_pnl = []
    daily_pnl = []
    for date in unique_dates:
        pnl_cum += daily_pnl_map[date]
        cumulative_pnl.append({"date": date, "pnl": round(pnl_cum, 2)})
        daily_pnl.append({"date": date, "pnl": round(daily_pnl_map[date], 2)})

    # 2. Win Rate by Session
    sessions = ['London', 'New York', 'Asia', 'London-NY Overlap']
    win_rate_by_session = []
    for session in sessions:
        session_trades = [t for t in trades if t.session == session]
        s_wins = len([t for t in session_trades if t.outcome == 'Win'])
        s_losses = len([t for t in session_trades if t.outcome == 'Loss'])
        rate = (s_wins / (s_wins + s_losses) * 100.0) if (s_wins + s_losses) > 0 else 0.0
        win_rate_by_session.append({"session": session, "winRate": round(rate, 1)})

    # 3. PnL by Setup Type
    setup_types = [
        'Order Block', 'Fair Value Gap', 'Breaker Block', 'MSS',
        'Liquidity Sweep', 'Optimal Trade Entry', 'SIBI / BISI', 'NWOG / NDOG'
    ]
    setups_found = set(setup_types)
    for t in trades:
        if t.setup_type:
            setups_found.add(t.setup_type)

    pnl_by_setup = []
    for setup in setups_found:
        setup_trades = [t for t in trades if t.setup_type == setup]
        pnl_sum = sum([t.net_pnl_usd for t in setup_trades])
        pnl_by_setup.append({"setup": setup, "pnl": round(pnl_sum, 2)})
    pnl_by_setup.sort(key=lambda x: x["pnl"], reverse=True)

    # 4. Most Common Mistakes
    mistakes_count = {}
    for t in trades:
        try:
            mistakes_list = json.loads(t.mistakes or "[]")
        except Exception:
            mistakes_list = []
        for m in mistakes_list:
            if m and m != 'No Mistake':
                mistakes_count[m] = mistakes_count.get(m, 0) + 1
    most_common_mistakes = [{"mistake": k, "count": v} for k, v in mistakes_count.items()]
    most_common_mistakes.sort(key=lambda x: x["count"], reverse=True)

    # 5. Win Rate by Direction
    long_trades = [t for t in trades if t.direction == 'Long']
    short_trades = [t for t in trades if t.direction == 'Short']

    l_wins = len([t for t in long_trades if t.outcome == 'Win'])
    l_losses = len([t for t in long_trades if t.outcome == 'Loss'])
    long_win_rate = (l_wins / (l_wins + l_losses) * 100.0) if (l_wins + l_losses) > 0 else 0.0

    s_wins = len([t for t in short_trades if t.outcome == 'Win'])
    s_losses = len([t for t in short_trades if t.outcome == 'Loss'])
    short_win_rate = (s_wins / (s_wins + s_losses) * 100.0) if (s_wins + s_losses) > 0 else 0.0

    win_rate_by_direction = {
        "longWinRate": round(long_win_rate, 1),
        "shortWinRate": round(short_win_rate, 1)
    }

    # 6. Confluences Performance
    confluences_perform = {}
    default_confluences = [
        'HTF OB', 'FVG', 'Premium / Discount', 'Liquidity Above', 'Liquidity Below',
        'Market Structure Shift', 'VWAP', 'PDH / PDL', 'Weekly High / Low',
        'Daily Bias Aligned', 'HTF RB', 'HTF BB'
    ]
    for c in default_confluences:
        confluences_perform[c] = {"count": 0, "wins": 0, "totalWL": 0}

    for t in trades:
        try:
            confluences_list = json.loads(t.confluences or "[]")
        except Exception:
            confluences_list = []
        for c in confluences_list:
            if c not in confluences_perform:
                confluences_perform[c] = {"count": 0, "wins": 0, "totalWL": 0}
            confluences_perform[c]["count"] += 1
            if t.outcome == 'Win':
                confluences_perform[c]["wins"] += 1
                confluences_perform[c]["totalWL"] += 1
            elif t.outcome == 'Loss':
                confluences_perform[c]["totalWL"] += 1

    confluences_performance = []
    for c, stats in confluences_perform.items():
        win_rate = (stats["wins"] / stats["totalWL"] * 100.0) if stats["totalWL"] > 0 else 0.0
        confluences_performance.append({
            "confluence": c,
            "count": stats["count"],
            "winRate": round(win_rate, 1)
        })
    confluences_performance.sort(key=lambda x: x["count"], reverse=True)

    # 7. Outcome Distribution
    outcomes = ['Win', 'Loss', 'Breakeven', 'Running']
    outcome_distribution = []
    total_count = len(trades)
    for out in outcomes:
        count = len([t for t in trades if t.outcome == out])
        pct = (count / total_count * 100.0) if total_count > 0 else 0.0
        outcome_distribution.append({
            "outcome": out,
            "count": count,
            "percentage": round(pct, 1)
        })

    return {
        "cumulativePnl": cumulative_pnl,
        "dailyPnl": daily_pnl,
        "winRateBySession": win_rate_by_session,
        "pnlBySetup": pnl_by_setup,
        "mostCommonMistakes": most_common_mistakes,
        "winRateByDirection": win_rate_by_direction,
        "confluencesPerformance": confluences_performance,
        "outcomeDistribution": outcome_distribution
    }

@router.get("/analytics/fees")
def get_analytics_fees(user: User = Depends(get_user), db: Session = Depends(get_db)):
    trades = db.query(JournalTrade).filter(JournalTrade.user_id == user.id).order_by(JournalTrade.date.asc(), JournalTrade.id.asc()).all()

    total_trades = len(trades)
    total_fees = 0.0
    biggest_single_fee = 0.0
    sum_gross_pnl_positive = 0.0
    daily_fees_map = {}
    contract_fees_map = {}
    fees_turned_wins_to_losses = 0

    for t in trades:
        f_abs = abs(t.fee_usd)
        total_fees += f_abs

        if f_abs > biggest_single_fee:
            biggest_single_fee = f_abs
        if t.pnl_usd > 0:
            sum_gross_pnl_positive += t.pnl_usd

        daily_fees_map[t.date] = daily_fees_map.get(t.date, 0.0) + f_abs
        contract_fees_map[t.pair_instrument] = contract_fees_map.get(t.pair_instrument, 0.0) + f_abs

        if t.pnl_usd > 0 and t.net_pnl_usd < 0:
            fees_turned_wins_to_losses += 1

    average_fee_per_trade = total_fees / total_trades if total_trades > 0 else 0.0
    fees_percentage_of_gross = (total_fees / sum_gross_pnl_positive * 100.0) if sum_gross_pnl_positive > 0 else 0.0

    sorted_dates = sorted(daily_fees_map.keys())
    rolling_fees = 0.0
    cumulative_fees = []
    daily_fees = []
    for date in sorted_dates:
        rolling_fees += daily_fees_map[date]
        cumulative_fees.append({"date": date, "fees": round(rolling_fees, 2)})
        daily_fees.append({"date": date, "fees": round(daily_fees_map[date], 2)})

    fees_by_contract = [{"pair": k, "fees": round(v, 2)} for k, v in contract_fees_map.items()]
    fees_by_contract.sort(key=lambda x: x["fees"], reverse=True)

    most_expensive_day_date = ""
    most_expensive_day_amount = 0.0
    for date in sorted_dates:
        if daily_fees_map[date] > most_expensive_day_amount:
            most_expensive_day_amount = daily_fees_map[date]
            most_expensive_day_date = date

    fee_impact = {
        "feesTurnedWinsToLosses": fees_turned_wins_to_losses,
        "extraMoneyWithoutFees": round(total_fees, 2),
        "mostExpensiveTradingDay": {
            "date": most_expensive_day_date,
            "amount": round(most_expensive_day_amount, 2)
        }
    }

    return {
        "totalFees": round(total_fees, 2),
        "averageFeePerTrade": round(average_fee_per_trade, 2),
        "biggestSingleFee": round(biggest_single_fee, 2),
        "feesPercentageOfGross": round(fees_percentage_of_gross, 2),
        "cumulativeFees": cumulative_fees,
        "dailyFees": daily_fees,
        "feesByContract": fees_by_contract,
        "feeImpact": fee_impact
    }
