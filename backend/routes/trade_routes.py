from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from backend.models import TradeCreate, TradeUpdate
from backend.security import get_current_user
from backend.database import trades_col, trading_days_col, screenshots_col
from typing import Optional
import os

router = APIRouter(prefix="/api", tags=["Trades"])


def _calc_duration(entry_date, entry_time, exit_date, exit_time):
    """Calculate duration in minutes between entry and exit."""
    if not all([entry_date, entry_time, exit_date, exit_time]):
        return None
    try:
        entry = datetime.strptime(f"{entry_date} {entry_time}", "%Y-%m-%d %H:%M")
        exit_ = datetime.strptime(f"{exit_date} {exit_time}", "%Y-%m-%d %H:%M")
        diff = (exit_ - entry).total_seconds() / 60
        return round(diff) if diff >= 0 else None
    except ValueError:
        return None


def _calc_pnl(trade_type, entry_price, exit_price, quantity):
    """Calculate P&L from trade data."""
    if not all([entry_price, exit_price, quantity]):
        return None
    if trade_type == "BUY":
        return round((exit_price - entry_price) * quantity, 2)
    else:
        return round((entry_price - exit_price) * quantity, 2)


def _serialize_trade(t: dict) -> dict:
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


@router.post("/trading-days/{date}/trades", status_code=status.HTTP_201_CREATED)
def create_trade(date: str, data: TradeCreate, current_user: dict = Depends(get_current_user)):
    """Create a new trade under a trading day (auto-creates the day if needed)."""
    user_oid = ObjectId(current_user["id"])
    now = datetime.now(timezone.utc)

    # Auto-create trading day if it doesn't exist
    day = trading_days_col().find_one({"user_id": user_oid, "date": date})
    if not day:
        day_doc = {
            "user_id": user_oid,
            "date": date,
            "daily_notes": "",
            "what_went_well": "",
            "mistakes": "",
            "tomorrow_plan": "",
            "day_rating": "",
            "created_at": now,
            "updated_at": now,
        }
        result = trading_days_col().insert_one(day_doc)
        day = trading_days_col().find_one({"_id": result.inserted_id})

    duration = _calc_duration(data.entry_date, data.entry_time, data.exit_date, data.exit_time)
    pnl = _calc_pnl(data.trade_type, data.entry_price, data.exit_price, data.quantity)

    trade_doc = {
        "user_id": user_oid,
        "trading_day_id": day["_id"],
        **data.model_dump(),
        "duration_minutes": duration,
        "pnl": pnl,
        "created_at": now,
        "updated_at": now,
    }
    result = trades_col().insert_one(trade_doc)
    trade_doc["_id"] = result.inserted_id
    return _serialize_trade(trade_doc)


@router.get("/trades")
def get_trades(
    symbol: Optional[str] = None,
    strategy: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    trade_type: Optional[str] = None,
    result_filter: Optional[str] = Query(None, alias="result"),
    mistake: Optional[str] = None,
    emotion: Optional[str] = None,
    followed_plan: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List trades with filters and pagination."""
    query = {"user_id": ObjectId(current_user["id"])}
    if symbol:
        query["symbol"] = {"$regex": symbol, "$options": "i"}
    if strategy:
        query["strategy"] = {"$regex": strategy, "$options": "i"}
    if trade_type:
        query["trade_type"] = trade_type
    if start_date:
        query.setdefault("entry_date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("entry_date", {})["$lte"] = end_date
    if result_filter == "WIN":
        query["pnl"] = {"$gt": 0}
    elif result_filter == "LOSS":
        query["pnl"] = {"$lt": 0}
    if mistake:
        query["mistakes"] = mistake
    if emotion:
        query["$or"] = [{"emotion_before": emotion}, {"emotion_after": emotion}]
    if followed_plan:
        query["followed_plan"] = followed_plan

    total = trades_col().count_documents(query)
    skip = (page - 1) * limit
    trade_docs = list(trades_col().find(query).sort("entry_date", -1).skip(skip).limit(limit))

    return {
        "trades": [_serialize_trade(t) for t in trade_docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.get("/trades/{trade_id}")
def get_trade(trade_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single trade by ID."""
    trade = trades_col().find_one({"_id": ObjectId(trade_id)})
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    if str(trade["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return _serialize_trade(trade)


@router.put("/trades/{trade_id}")
def update_trade(trade_id: str, data: TradeUpdate, current_user: dict = Depends(get_current_user)):
    """Update a trade."""
    trade = trades_col().find_one({"_id": ObjectId(trade_id)})
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    if str(trade["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    update_fields = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}

    # Merge with existing values for recalculation
    merged = {**trade, **update_fields}
    update_fields["duration_minutes"] = _calc_duration(
        merged.get("entry_date"), merged.get("entry_time"),
        merged.get("exit_date"), merged.get("exit_time"),
    )
    update_fields["pnl"] = _calc_pnl(
        merged.get("trade_type"), merged.get("entry_price"),
        merged.get("exit_price"), merged.get("quantity"),
    )
    update_fields["updated_at"] = datetime.now(timezone.utc)

    trades_col().update_one({"_id": ObjectId(trade_id)}, {"$set": update_fields})
    updated = trades_col().find_one({"_id": ObjectId(trade_id)})
    return _serialize_trade(updated)


@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a trade and its screenshots."""
    trade = trades_col().find_one({"_id": ObjectId(trade_id)})
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    if str(trade["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Delete associated screenshots
    for ss in screenshots_col().find({"trade_id": ObjectId(trade_id)}):
        try:
            os.remove(ss.get("file_path", ""))
        except OSError:
            pass
    screenshots_col().delete_many({"trade_id": ObjectId(trade_id)})
    trades_col().delete_one({"_id": ObjectId(trade_id)})
    return {"message": "Trade deleted"}
