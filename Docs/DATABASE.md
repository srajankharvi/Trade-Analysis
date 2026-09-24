# TradeJournal — Database Documentation

Database:

MongoDB Atlas

Database name:

tradejournal

---

# Collections

users
trading_days
trades
screenshots
strategies

---

# users

Example:

{
    "_id": ObjectId,
    "name": "John",
    "email": "john@example.com",
    "password_hash": "...",
    "created_at": ISODate,
    "updated_at": ISODate
}

Indexes:

email UNIQUE

---

# trading_days

Example:

{
    "_id": ObjectId,
    "user_id": ObjectId,
    "date": "2026-09-23",

    "daily_notes": "...",
    "what_went_well": "...",
    "mistakes": "...",
    "tomorrow_plan": "...",
    "day_rating": "Good",

    "created_at": ISODate,
    "updated_at": ISODate
}

Indexes:

user_id + date

---

# trades

Example:

{
    "_id": ObjectId,

    "user_id": ObjectId,
    "trading_day_id": ObjectId,

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

    "duration_minutes": 45,

    "pnl": 3500,

    "market_condition": "Trending",

    "entry_reason": "...",
    "exit_reason": "...",

    "emotion_before": "Confident",
    "emotion_after": "Satisfied",

    "followed_plan": "YES",

    "mistakes": [
        "Late Entry"
    ],

    "notes": "...",

    "created_at": ISODate,
    "updated_at": ISODate
}

Indexes:

user_id + trading_day_id
user_id + entry_date
user_id + symbol
user_id + strategy
user_id + entry_time

---

# screenshots

Example:

{
    "_id": ObjectId,

    "user_id": ObjectId,
    "trade_id": ObjectId,

    "file_name": "uuid.png",
    "file_path": "/uploads/uuid.png",
    "file_type": "image/png",
    "file_size": 345678,

    "uploaded_at": ISODate
}

Indexes:

trade_id
user_id

---

# strategies

Example:

{
    "_id": ObjectId,

    "user_id": ObjectId,

    "name": "Breakout",
    "description": "Breakout setup",

    "created_at": ISODate
}

Indexes:

user_id + name

---

# Relationships

User

1
|
|---- many Trading Days
|
|---- many Trades
|
|---- many Strategies

Trading Day

1
|
|---- many Trades

Trade

1
|
|---- many Screenshots

---

# Data Ownership

Every user-owned document should contain:

user_id

Backend must verify ownership before returning, modifying, or deleting the document.

---

# Important Rule

Do not store all trades for a day inside a single giant document.

Use independent trade documents.
hon

This allows:

- Pagination
- Searching
- Filtering
- Editing
- Deleting
- Analytics
- Scalability
