from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date


# ── Auth ──

class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=200)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Trading Days ──

class TradingDayCreate(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")


class TradingDayUpdate(BaseModel):
    daily_notes: Optional[str] = None
    what_went_well: Optional[str] = None
    mistakes: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    day_rating: Optional[str] = None


# ── Trades ──

class TradeCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=50)
    instrument: Optional[str] = None
    trade_type: str = Field(..., pattern=r"^(BUY|SELL)$")
    strategy: Optional[str] = None
    setup: Optional[str] = None

    entry_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    entry_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    exit_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    exit_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")

    entry_price: float = Field(..., gt=0)
    exit_price: Optional[float] = Field(None, gt=0)
    quantity: float = Field(..., gt=0)
    stop_loss: Optional[float] = None
    target: Optional[float] = None

    market_condition: Optional[str] = None
    entry_reason: Optional[str] = None
    exit_reason: Optional[str] = None

    emotion_before: Optional[str] = None
    emotion_after: Optional[str] = None

    followed_plan: Optional[str] = None
    mistakes: Optional[List[str]] = None
    notes: Optional[str] = None


class TradeUpdate(BaseModel):
    symbol: Optional[str] = None
    instrument: Optional[str] = None
    trade_type: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None

    entry_date: Optional[str] = None
    entry_time: Optional[str] = None
    exit_date: Optional[str] = None
    exit_time: Optional[str] = None

    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    quantity: Optional[float] = None
    stop_loss: Optional[float] = None
    target: Optional[float] = None

    market_condition: Optional[str] = None
    entry_reason: Optional[str] = None
    exit_reason: Optional[str] = None

    emotion_before: Optional[str] = None
    emotion_after: Optional[str] = None

    followed_plan: Optional[str] = None
    mistakes: Optional[List[str]] = None
    notes: Optional[str] = None
