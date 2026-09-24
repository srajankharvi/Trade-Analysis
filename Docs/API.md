# TradeJournal API Documentation

Base URL:

/api

---

# Authentication

## Register

POST /api/auth/register

Request:

{
    "name": "John",
    "email": "john@example.com",
    "password": "secure-password"
}

Response:

{
    "message": "Registration successful"
}

---

# Login

POST /api/auth/login

Request:

{
    "email": "john@example.com",
    "password": "secure-password"
}

Response:

{
    "access_token": "JWT_TOKEN",
    "token_type": "bearer"
}

---

# Current User

GET /api/auth/me

Authorization:

Bearer JWT_TOKEN

Response:

{
    "id": "...",
    "name": "John",
    "email": "john@example.com"
}

---

# Trading Days

## Get Trading Days

GET /api/trading-days

Optional query:

?start_date=2026-09-01&end_date=2026-09-30

Response:

[
    {
        "id": "...",
        "date": "2026-09-23",
        "trade_count": 8,
        "pnl": 2450
    }
]

---

# Create Trading Day

POST /api/trading-days

Request:

{
    "date": "2026-09-23"
}

---

# Get Trading Day

GET /api/trading-days/{date}

Response:

{
    "date": "2026-09-23",
    "trade_count": 8,
    "pnl": 2450,
    "trades": []
}

---

# Update Trading Day

PUT /api/trading-days/{date}

Request:

{
    "daily_notes": "Good trading day",
    "what_went_well": "Followed the plan",
    "mistakes": "Entered one trade late",
    "tomorrow_plan": "Wait for confirmation",
    "day_rating": "Good"
}

---

# Delete Trading Day

DELETE /api/trading-days/{date}

---

# Trades

## Create Trade

POST /api/trading-days/{date}/trades

Request:

{
    "symbol": "NIFTY",
    "instrument": "Index",
    "trade_type": "BUY",
    "strategy": "Breakout",
    "setup": "Resistance breakout",
    "entry_date": "2026-09-23",
    "entry_time": "10:25",
    "exit_date": "2026-09-23",
    "exit_time": "11:10",
    "entry_price": 24150,
    "exit_price": 24220,
    "quantity": 50,
    "stop_loss": 24090,
    "target": 24250,
    "market_condition": "Trending",
    "entry_reason": "Breakout confirmation",
    "exit_reason": "Target reached",
    "emotion_before": "Confident",
    "emotion_after": "Satisfied",
    "followed_plan": "YES",
    "notes": "Trade followed the setup"
}

---

# Get Trades

GET /api/trades

Optional filters:

?symbol=NIFTY

?strategy=Breakout

?start_date=2026-09-01

?end_date=2026-09-30

?trade_type=BUY

?page=1

?limit=20

---

# Get Trade

GET /api/trades/{id}

---

# Update Trade

PUT /api/trades/{id}

Request:

{
    "exit_price": 24230,
    "notes": "Updated note"
}

---

# Delete Trade

DELETE /api/trades/{id}

---

# Screenshots

## Upload Screenshot

POST /api/trades/{id}/screenshots

Content-Type:

multipart/form-data

Field:

file

---

# Get Screenshots

GET /api/trades/{id}/screenshots

---

# Delete Screenshot

DELETE /api/screenshots/{id}

---

# Analytics

## Overview

GET /api/analytics/overview

Optional:

?start_date=2026-09-01&end_date=2026-09-30

Response:

{
    "total_trades": 126,
    "winning_trades": 72,
    "losing_trades": 54,
    "win_rate": 57.1,
    "gross_profit": 25000,
    "gross_loss": 6550,
    "net_pnl": 18450,
    "average_duration_minutes": 27,
    "total_trading_minutes": 2538
}

---

# P&L Analytics

GET /api/analytics/pnl

---

# Strategy Analytics

GET /api/analytics/strategies

---

# Time Analytics

GET /api/analytics/time

---

# Mistake Analytics

GET /api/analytics/mistakes

---

# Emotion Analytics

GET /api/analytics/emotions

---

# Reports

GET /api/reports/daily

GET /api/reports/weekly

GET /api/reports/monthly

GET /api/reports/custom

Query:

?start_date=2026-09-01&end_date=2026-09-30

---

# Error Format

Errors should use:

{
    "detail": "Human-readable error message"
}

Common status codes:

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
422 Validation Error
500 Internal Server Error
