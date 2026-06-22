from collections import defaultdict

# ── Emotion Profiles ──────────────────────────────────────────────────────────
EMOTION_SCORES = {
    "Calm": 1, "Neutral": 1.5, "Anxious": 3, "Fear": 3.5,
    "Frustrated": 4, "Overconfident": 4.5, "Angry": 5, "Euphoric": 4.8
}

EMOTION_RISK = {
    "Calm": "low", "Neutral": "low", "Anxious": "medium", "Fear": "medium",
    "Frustrated": "high", "Overconfident": "high", "Angry": "very_high", "Euphoric": "very_high"
}

def get_emotion_score(emotion: str) -> float:
    return EMOTION_SCORES.get(emotion, 1.5)

def get_emotion_risk(emotion: str) -> str:
    return EMOTION_RISK.get(emotion, "low")

# ── Core Metrics ──────────────────────────────────────────────────────────────
def calculate_rdi(actual_risk: float, planned_risk: float) -> float:
    if planned_risk == 0:
        return 0.0
    return abs(actual_risk - planned_risk) / planned_risk

def calculate_evi(emotion_before: str, emotion_after: str) -> float:
    """Directional EVI — extra penalty for moving into very high risk state."""
    raw_delta = abs(get_emotion_score(emotion_before) - get_emotion_score(emotion_after))
    if get_emotion_risk(emotion_after) == "very_high":
        return raw_delta + 1
    return raw_delta

# ── Discipline Score ──────────────────────────────────────────────────────────
def compute_discipline_score(past_trades: list, new_trade: dict) -> float:
    """
    Recalculate discipline score from scratch across all trades.
    past_trades: list of Trade ORM objects
    new_trade:   dict with keys matching the trade fields
    """
    score = 100.0
    all_trades = []

    # Convert ORM objects to dicts for uniform processing
    for t in past_trades:
        all_trades.append({
            "timestamp": t.timestamp.isoformat() if t.timestamp else "",
            "actual_risk": t.actual_risk,
            "planned_risk": t.planned_risk,
            "rule_followed": t.rule_followed,
            "emotion_before": t.emotion_before,
            "emotion_after": t.emotion_after,
            "outcome": t.outcome,
        })

    all_trades.append(new_trade)

    # Per-trade penalties
    for t in all_trades:
        if t["actual_risk"] > t["planned_risk"]:
            score -= 10                              # Over-risking penalty
        if not t["rule_followed"]:
            score -= 10                              # Rule violation penalty
        evi = calculate_evi(t["emotion_before"], t["emotion_after"])
        score -= (5 * evi)                           # Emotional instability penalty

    # Consecutive loss penalty — only within the same trading day
    trades_by_day = defaultdict(list)
    for t in all_trades:
        day = t.get("timestamp", "")[:10]
        trades_by_day[day].append(t["outcome"])

    for day, outcomes in trades_by_day.items():
        for i in range(1, len(outcomes)):
            if outcomes[i] == "loss" and outcomes[i - 1] == "loss":
                score -= 15                          # Consecutive loss penalty

    return round(max(0.0, score), 1)

# ── Bias Detection ────────────────────────────────────────────────────────────
def detect_biases(past_trades: list, new_trade: dict) -> list:
    """Detect psychological biases based on trade history."""
    biases = []

    # Revenge trading — increased size after a loss
    if past_trades:
        last = past_trades[-1]
        if last.outcome == "loss" and new_trade["actual_risk"] > last.actual_risk * 1.2:
            biases.append("Revenge Trading — position size increased after a loss")

    # Overconfidence — elevated size after 3 consecutive wins
    if len(past_trades) >= 3 and all(t.outcome == "win" for t in past_trades[-3:]):
        avg_risk = sum(t.actual_risk for t in past_trades[-3:]) / 3
        if new_trade["actual_risk"] > avg_risk * 1.3:
            biases.append("Overconfidence — position size elevated after win streak")

    # Emotional deterioration — high risk emotional state after trade
    if get_emotion_risk(new_trade["emotion_after"]) in ["high", "very_high"]:
        biases.append(f"Emotional Risk — post-trade state is {new_trade['emotion_after']}")

    # Overtrading — 5+ trades today
    from datetime import datetime
    today = datetime.utcnow().date().isoformat()
    today_count = sum(1 for t in past_trades if t.timestamp.date().isoformat() == today)
    if today_count >= 5:
        biases.append("Overtrading — 5 or more trades logged today")

    return biases

# ── Consecutive Loss Check ────────────────────────────────────────────────────
def check_consecutive_losses(past_trades: list, n: int = 2) -> bool:
    """Check if the last n trades today are all losses."""
    from datetime import datetime
    today = datetime.utcnow().date().isoformat()
    today_trades = [t for t in past_trades if t.timestamp.date().isoformat() == today]
    if len(today_trades) < n:
        return False
    return all(t.outcome == "loss" for t in today_trades[-n:])
