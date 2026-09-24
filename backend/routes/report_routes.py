import csv
import io
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
from backend.security import get_current_user
from backend.database import trades_col
from typing import Optional

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _get_report_data(user_id: str, start_date: str, end_date: str) -> dict:
    """Generate report statistics for a date range."""
    query = {
        "user_id": ObjectId(user_id),
        "entry_date": {"$gte": start_date, "$lte": end_date},
    }
    trades = list(trades_col().find(query).sort("entry_date", 1))
    total = len(trades)

    if total == 0:
        return {
            "start_date": start_date, "end_date": end_date,
            "total_trades": 0, "winning_trades": 0, "losing_trades": 0,
            "win_rate": 0, "gross_profit": 0, "gross_loss": 0,
            "net_pnl": 0, "average_pnl": 0, "best_trade": 0, "worst_trade": 0,
            "total_duration_minutes": 0, "average_duration_minutes": 0,
            "strategies": [], "common_mistakes": [], "trades": [],
        }

    pnls = [t.get("pnl") or 0 for t in trades]
    winning = [p for p in pnls if p > 0]
    losing = [p for p in pnls if p < 0]
    durations = [t.get("duration_minutes") or 0 for t in trades if t.get("duration_minutes")]

    # Strategy summary
    strat_map = {}
    for t in trades:
        s = t.get("strategy") or "No Strategy"
        strat_map.setdefault(s, {"name": s, "trades": 0, "wins": 0, "pnl": 0})
        strat_map[s]["trades"] += 1
        p = t.get("pnl") or 0
        strat_map[s]["pnl"] += p
        if p > 0:
            strat_map[s]["wins"] += 1

    strategies = []
    for sv in strat_map.values():
        strategies.append({
            "name": sv["name"],
            "total_trades": sv["trades"],
            "win_rate": round(sv["wins"] / sv["trades"] * 100, 1) if sv["trades"] else 0,
            "total_pnl": round(sv["pnl"], 2),
        })

    # Mistake summary
    from collections import Counter
    mistake_counter = Counter()
    for t in trades:
        for m in (t.get("mistakes") or []):
            mistake_counter[m] += 1

    common_mistakes = [{"mistake": m, "count": c} for m, c in mistake_counter.most_common(10)]

    # Serialize trades for export
    trade_list = []
    for t in trades:
        trade_list.append({
            "date": t.get("entry_date", ""),
            "symbol": t.get("symbol", ""),
            "instrument": t.get("instrument", ""),
            "trade_type": t.get("trade_type", ""),
            "strategy": t.get("strategy", ""),
            "entry_time": t.get("entry_time", ""),
            "exit_time": t.get("exit_time", ""),
            "entry_price": t.get("entry_price", 0),
            "exit_price": t.get("exit_price", 0),
            "quantity": t.get("quantity", 0),
            "pnl": t.get("pnl", 0),
            "duration_minutes": t.get("duration_minutes", 0),
            "mistakes": ", ".join(t.get("mistakes") or []),
            "emotion_before": t.get("emotion_before", ""),
            "emotion_after": t.get("emotion_after", ""),
            "followed_plan": t.get("followed_plan", ""),
            "notes": t.get("notes", ""),
        })

    return {
        "start_date": start_date, "end_date": end_date,
        "total_trades": total,
        "winning_trades": len(winning),
        "losing_trades": len(losing),
        "win_rate": round(len(winning) / total * 100, 1) if total else 0,
        "gross_profit": round(sum(winning), 2),
        "gross_loss": round(sum(losing), 2),
        "net_pnl": round(sum(pnls), 2),
        "average_pnl": round(sum(pnls) / total, 2),
        "best_trade": round(max(pnls), 2),
        "worst_trade": round(min(pnls), 2),
        "total_duration_minutes": sum(durations),
        "average_duration_minutes": round(sum(durations) / len(durations)) if durations else 0,
        "strategies": strategies,
        "common_mistakes": common_mistakes,
        "trades": trade_list,
    }


def _export_csv(data: dict) -> StreamingResponse:
    """Export report trades as CSV."""
    output = io.StringIO()
    trades = data.get("trades", [])
    if not trades:
        output.write("No trades found for this period\n")
    else:
        writer = csv.DictWriter(output, fieldnames=trades[0].keys())
        writer.writeheader()
        writer.writerows(trades)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{data['start_date']}_{data['end_date']}.csv"},
    )


def _export_json(data: dict) -> StreamingResponse:
    """Export full report as JSON."""
    content = json.dumps(data, indent=2, default=str)
    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=report_{data['start_date']}_{data['end_date']}.json"},
    )


@router.get("/daily")
def daily_report(
    date: Optional[str] = None,
    export: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Daily report for a specific date."""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    data = _get_report_data(current_user["id"], date, date)
    if export == "csv":
        return _export_csv(data)
    if export == "json":
        return _export_json(data)
    return data


@router.get("/weekly")
def weekly_report(
    date: Optional[str] = None,
    export: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Weekly report. 'date' should be any date in the target week."""
    if not date:
        d = datetime.now()
    else:
        d = datetime.strptime(date, "%Y-%m-%d")
    start = d - timedelta(days=d.weekday())
    end = start + timedelta(days=6)
    data = _get_report_data(current_user["id"], start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    if export == "csv":
        return _export_csv(data)
    if export == "json":
        return _export_json(data)
    return data


@router.get("/monthly")
def monthly_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    export: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Monthly report."""
    now = datetime.now()
    y = year or now.year
    m = month or now.month
    start = f"{y}-{m:02d}-01"
    if m == 12:
        end = f"{y + 1}-01-01"
    else:
        end = f"{y}-{m + 1:02d}-01"
    # End date should be last day of month
    end_dt = datetime.strptime(end, "%Y-%m-%d") - timedelta(days=1)
    data = _get_report_data(current_user["id"], start, end_dt.strftime("%Y-%m-%d"))
    if export == "csv":
        return _export_csv(data)
    if export == "json":
        return _export_json(data)
    return data


@router.get("/custom")
def custom_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    export: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Custom date range report."""
    data = _get_report_data(current_user["id"], start_date, end_date)
    if export == "csv":
        return _export_csv(data)
    if export == "json":
        return _export_json(data)
    return data
