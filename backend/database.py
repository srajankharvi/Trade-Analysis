from pymongo import MongoClient, ASCENDING
from backend.config import get_settings

_client = None
_db = None


def get_database():
    """Return the MongoDB database instance, creating the connection if needed."""
    global _client, _db
    if _db is None:
        settings = get_settings()
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client[settings.MONGODB_DATABASE]
    return _db


def get_collection(name: str):
    """Return a named collection from the database."""
    return get_database()[name]


# --- Collection accessors ---

def users_col():
    return get_collection("users")

def trading_days_col():
    return get_collection("trading_days")

def trades_col():
    return get_collection("trades")

def screenshots_col():
    return get_collection("screenshots")

def strategies_col():
    return get_collection("strategies")


def create_indexes():
    """Create all required indexes (idempotent)."""
    users_col().create_index([("email", ASCENDING)], unique=True)

    trading_days_col().create_index([("user_id", ASCENDING), ("date", ASCENDING)], unique=True)

    trades_col().create_index([("user_id", ASCENDING), ("trading_day_id", ASCENDING)])
    trades_col().create_index([("user_id", ASCENDING), ("entry_date", ASCENDING)])
    trades_col().create_index([("user_id", ASCENDING), ("symbol", ASCENDING)])
    trades_col().create_index([("user_id", ASCENDING), ("strategy", ASCENDING)])
    trades_col().create_index([("user_id", ASCENDING), ("entry_time", ASCENDING)])

    screenshots_col().create_index([("trade_id", ASCENDING)])
    screenshots_col().create_index([("user_id", ASCENDING)])

    strategies_col().create_index([("user_id", ASCENDING), ("name", ASCENDING)], unique=True)
