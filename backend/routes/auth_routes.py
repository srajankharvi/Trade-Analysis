from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from backend.models import UserRegister, UserLogin, TokenResponse, UserResponse
from backend.security import hash_password, verify_password, create_access_token, get_current_user
from backend.database import users_col
from fastapi import Depends

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister):
    """Register a new user."""
    if users_col().find_one({"email": data.email.lower()}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": data.name.strip(),
        "email": data.email.lower().strip(),
        "password_hash": hash_password(data.password),
        "created_at": now,
        "updated_at": now,
    }
    users_col().insert_one(user_doc)
    return {"message": "Registration successful"}


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin):
    """Login and receive a JWT access token."""
    user = users_col().find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(str(user["_id"]))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
    )
