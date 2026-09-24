from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from backend.models import TradingDayCreate, TradingDayUpdate
from backend.security import get_current_user
from backend.database import trading_days_col, trades_col, screenshots_col
from typing import Optional
import os

router = APIRouter(prefix="/api/trading-days", tags=["Trading Days"])


def _serialize_day(day: dict, trades=None) -> dict:
    """Convert a trading_day document to a JSON-safe dict."""
    result = {
        "id": str(day["_id"]),
        "date": day["date"],
        "daily_notes": day.get("daily_notes", ""),
        "what_went_well": day.get("what_went_well", ""),
        "mistakes": day.get("mistakes", ""),
        "tomorrow_plan": day.get("tomorrow_plan", ""),
        "day_rating": day.get("day_rating", ""),
        "created_at": day.get("created_at", ""),
        "updated_at": day.get("updated_at", ""),
    }
    if trades is not None:
        result["trades"] = trades
        result["trade_count"] = len(trades)
        result["pnl"] = sum(t.get("pnl", 0) or 0 for t in trades)
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def create_trading_day(data: TradingDayCreate, current_user: dict = Depends(get_current_user)):
    """Create a new trading day."""
    existing = trading_days_col().find_one({"user_id": ObjectId(current_user["id"]), "date": data.date})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trading day already exists for this date")

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": ObjectId(current_user["id"]),
        "date": data.date,
        "daily_notes": "",
        "what_went_well": "",
        "mistakes": "",
        "tomorrow_plan": "",
        "day_rating": "",
        "created_at": now,
        "updated_at": now,
    }
    result = trading_days_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_day(doc, trades=[])


@router.get("")
def get_trading_days(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List trading days with optional date range filter."""
    query = {"user_id": ObjectId(current_user["id"])}
    if start_date:
        query.setdefault("date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date

    days = list(trading_days_col().find(query).sort("date", -1))
    result = []
    for day in days:
        trade_docs = list(trades_col().find({"trading_day_id": day["_id"], "user_id": ObjectId(current_user["id"])}))
        trade_count = len(trade_docs)
        pnl = sum(t.get("pnl", 0) or 0 for t in trade_docs)
        winning = sum(1 for t in trade_docs if (t.get("pnl") or 0) > 0)
        losing = sum(1 for t in trade_docs if (t.get("pnl") or 0) < 0)
        d = _serialize_day(day)
        d["trade_count"] = trade_count
        d["pnl"] = pnl
        d["winning_trades"] = winning
        d["losing_trades"] = losing
        result.append(d)
    return result


@router.get("/{date}")
def get_trading_day(date: str, current_user: dict = Depends(get_current_user)):
    """Get a single trading day with its trades."""
    day = trading_days_col().find_one({"user_id": ObjectId(current_user["id"]), "date": date})
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trading day not found")

    trade_docs = list(trades_col().find({"trading_day_id": day["_id"], "user_id": ObjectId(current_user["id"])}).sort("entry_time", 1))
    trades = []
    for t in trade_docs:
        trades.append(_serialize_trade(t))
    return _serialize_day(day, trades=trades)


@router.put("/{date}")
def update_trading_day(date: str, data: TradingDayUpdate, current_user: dict = Depends(get_current_user)):
    """Update a trading day's reflection fields."""
    day = trading_days_col().find_one({"user_id": ObjectId(current_user["id"]), "date": date})
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trading day not found")

    update_fields = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc)
    trading_days_col().update_one({"_id": day["_id"]}, {"$set": update_fields})
    updated = trading_days_col().find_one({"_id": day["_id"]})
    return _serialize_day(updated)


@router.delete("/{date}", status_code=status.HTTP_200_OK)
def delete_trading_day(date: str, current_user: dict = Depends(get_current_user)):
    """Delete a trading day and all associated trades and screenshots."""
    day = trading_days_col().find_one({"user_id": ObjectId(current_user["id"]), "date": date})
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trading day not found")

    # Delete associated screenshots files
    trade_ids = [t["_id"] for t in trades_col().find({"trading_day_id": day["_id"]}, {"_id": 1})]
    for ss in screenshots_col().find({"trade_id": {"$in": trade_ids}}):
        try:
            os.remove(ss.get("file_path", ""))
        except OSError:
            pass
    screenshots_col().delete_many({"trade_id": {"$in": trade_ids}})
    trades_col().delete_many({"trading_day_id": day["_id"]})
    trading_days_col().delete_one({"_id": day["_id"]})
    return {"message": "Trading day deleted"}


def _serialize_trade(t: dict) -> dict:
    """Convert a trade document to a JSON-safe dict."""
    return {
        "id": str(t["_id"]),
        "trading_day_id": str(t.get("trading_day_id", "")),
        "symbol": t.get("symbol", ""),
        "instrument": t.get("instrument", ""),
        "trade_type": t.get("trade_type", ""),
        "strategy": t.get("strategy", ""),
        "setup": t.get("setup", ""),
        "entry_date": t.get("entry_date", ""),
        "entry_time": t.get("entry_time", ""),
        "exit_date": t.get("exit_date", ""),
        "exit_time": t.get("exit_time", ""),
        "entry_price": t.get("entry_price", 0),
        "exit_price": t.get("exit_price"),
        "quantity": t.get("quantity", 0),
        "stop_loss": t.get("stop_loss"),
        "target": t.get("target"),
        "duration_minutes": t.get("duration_minutes"),
        "pnl": t.get("pnl"),
        "market_condition": t.get("market_condition", ""),
        "entry_reason": t.get("entry_reason", ""),
        "exit_reason": t.get("exit_reason", ""),
        "emotion_before": t.get("emotion_before", ""),
        "emotion_after": t.get("emotion_after", ""),
        "followed_plan": t.get("followed_plan", ""),
        "mistakes": t.get("mistakes", []),
        "notes": t.get("notes", ""),
        "created_at": str(t.get("created_at", "")),
        "updated_at": str(t.get("updated_at", "")),
    }
