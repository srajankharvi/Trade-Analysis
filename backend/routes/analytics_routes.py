from fastapi import APIRouter, Depends, Query
from bson import ObjectId
from backend.security import get_current_user
from backend.database import trades_col
from typing import Optional
from collections import Counter

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _get_user_trades(user_id: str, start_date: str = None, end_date: str = None) -> list:
    """Fetch all trades for a user, optionally filtered by date range."""
    query = {"user_id": ObjectId(user_id)}
    if start_date:
        query.setdefault("entry_date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("entry_date", {})["$lte"] = end_date
    return list(trades_col().find(query).sort("entry_date", 1))


@router.get("/overview")
def analytics_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Overview analytics: total trades, win rate, P&L, durations."""
    trades = _get_user_trades(current_user["id"], start_date, end_date)
    total = len(trades)
    if total == 0:
        return {
            "total_trades": 0, "winning_trades": 0, "losing_trades": 0,
            "breakeven_trades": 0, "win_rate": 0, "gross_profit": 0,
            "gross_loss": 0, "net_pnl": 0, "average_pnl": 0,
            "best_trade": 0, "worst_trade": 0,
            "average_duration_minutes": 0, "total_trading_minutes": 0,
        }

    pnls = [t.get("pnl") or 0 for t in trades]
    winning = [p for p in pnls if p > 0]
    losing = [p for p in pnls if p < 0]
    durations = [t.get("duration_minutes") or 0 for t in trades if t.get("duration_minutes")]

    return {
        "total_trades": total,
        "winning_trades": len(winning),
        "losing_trades": len(losing),
        "breakeven_trades": total - len(winning) - len(losing),
        "win_rate": round(len(winning) / total * 100, 1) if total else 0,
        "gross_profit": round(sum(winning), 2),
        "gross_loss": round(sum(losing), 2),
        "net_pnl": round(sum(pnls), 2),
        "average_pnl": round(sum(pnls) / total, 2),
        "best_trade": round(max(pnls), 2) if pnls else 0,
        "worst_trade": round(min(pnls), 2) if pnls else 0,
        "average_duration_minutes": round(sum(durations) / len(durations)) if durations else 0,
        "total_trading_minutes": sum(durations),
    }


@router.get("/pnl")
def analytics_pnl(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Daily P&L data for charts."""
    trades = _get_user_trades(current_user["id"], start_date, end_date)
    daily = {}
    for t in trades:
        d = t.get("entry_date", "")
        if d:
            daily.setdefault(d, 0)
            daily[d] += (t.get("pnl") or 0)

    # Build cumulative
    sorted_dates = sorted(daily.keys())
    cumulative = 0
    result = []
    for d in sorted_dates:
        cumulative += daily[d]
        result.append({"date": d, "pnl": round(daily[d], 2), "cumulative_pnl": round(cumulative, 2)})
    return result


@router.get("/strategies")
def analytics_strategies(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Per-strategy breakdown."""
    trades = _get_user_trades(current_user["id"], start_date, end_date)
    strategies = {}
    for t in trades:
        s = t.get("strategy") or "No Strategy"
        if s not in strategies:
            strategies[s] = {"name": s, "total": 0, "wins": 0, "losses": 0, "pnl": 0, "pnls": []}
        pnl = t.get("pnl") or 0
        strategies[s]["total"] += 1
        strategies[s]["pnl"] += pnl
        strategies[s]["pnls"].append(pnl)
        if pnl > 0:
            strategies[s]["wins"] += 1
        elif pnl < 0:
            strategies[s]["losses"] += 1

    result = []
    for s in strategies.values():
        result.append({
            "name": s["name"],
            "total_trades": s["total"],
            "winning_trades": s["wins"],
            "losing_trades": s["losses"],
            "win_rate": round(s["wins"] / s["total"] * 100, 1) if s["total"] else 0,
            "total_pnl": round(s["pnl"], 2),
            "average_pnl": round(s["pnl"] / s["total"], 2) if s["total"] else 0,
        })
    return sorted(result, key=lambda x: x["total_trades"], reverse=True)


@router.get("/time")
def analytics_time(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Time-of-day analysis."""
    trades = _get_user_trades(current_user["id"], start_date, end_date)
    hours = {}
    for t in trades:
        entry_time = t.get("entry_time", "")
        if entry_time:
            try:
                hour = int(entry_time.split(":")[0])
                label = f"{hour:02d}:00"
                if label not in hours:
                    hours[label] = {"hour": label, "total": 0, "wins": 0, "pnl": 0}
                pnl = t.get("pnl") or 0
                hours[label]["total"] += 1
                hours[label]["pnl"] += pnl
                if pnl > 0:
                    hours[label]["wins"] += 1
            except (ValueError, IndexError):
                pass

    result = []
    for h in sorted(hours.values(), key=lambda x: x["hour"]):
        result.append({
            "hour": h["hour"],
            "total_trades": h["total"],
            "winning_trades": h["wins"],
            "win_rate": round(h["wins"] / h["total"] * 100, 1) if h["total"] else 0,
            "total_pnl": round(h["pnl"], 2),
            "average_pnl": round(h["pnl"] / h["total"], 2) if h["total"] else 0,
        })
    return result


@router.get("/mistakes")
def analytics_mistakes(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Mistake frequency analysis."""
    trades = _get_user_trades(current_user["id"], start_date, end_date)
    counter = Counter()
    for t in trades:
        for m in (t.get("mistakes") or []):
            counter[m] += 1

    total_trades = len(trades)
    result = []
    for mistake, count in counter.most_common():
        result.append({
            "mistake": mistake,
            "count": count,
            "percentage": round(count / total_trades * 100, 1) if total_trades else 0,
        })
    return result


@router.get("/emotions")
def analytics_emotions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Emotion analysis: before and after trade emotions with win rates."""
    trades = _get_user_trades(current_user["id"], start_date, end_date)

    before = {}
    after = {}
    for t in trades:
        pnl = t.get("pnl") or 0
        eb = t.get("emotion_before") or "Not Recorded"
        ea = t.get("emotion_after") or "Not Recorded"

        if eb not in before:
            before[eb] = {"emotion": eb, "total": 0, "wins": 0, "pnl": 0}
        before[eb]["total"] += 1
        before[eb]["pnl"] += pnl
        if pnl > 0:
            before[eb]["wins"] += 1

        if ea not in after:
            after[ea] = {"emotion": ea, "total": 0, "wins": 0, "pnl": 0}
        after[ea]["total"] += 1
        after[ea]["pnl"] += pnl
        if pnl > 0:
            after[ea]["wins"] += 1

    def _format(data):
        result = []
        for e in data.values():
            result.append({
                "emotion": e["emotion"],
                "total_trades": e["total"],
                "winning_trades": e["wins"],
                "win_rate": round(e["wins"] / e["total"] * 100, 1) if e["total"] else 0,
                "total_pnl": round(e["pnl"], 2),
            })
        return sorted(result, key=lambda x: x["total_trades"], reverse=True)

    return {"before_trade": _format(before), "after_trade": _format(after)}
