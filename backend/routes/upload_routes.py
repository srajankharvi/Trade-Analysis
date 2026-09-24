import os
import uuid
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime, timezone
from bson import ObjectId
from backend.security import get_current_user
from backend.database import screenshots_col, trades_col
from backend.config import get_settings

router = APIRouter(prefix="/api", tags=["Screenshots"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp"}
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


def _serialize_screenshot(ss: dict) -> dict:
    return {
        "id": str(ss["_id"]),
        "trade_id": str(ss["trade_id"]),
        "file_name": ss.get("file_name", ""),
        "file_url": f"/uploads/{ss.get('file_name', '')}",
        "file_type": ss.get("file_type", ""),
        "file_size": ss.get("file_size", 0),
        "uploaded_at": str(ss.get("uploaded_at", "")),
    }


@router.post("/trades/{trade_id}/screenshots", status_code=status.HTTP_201_CREATED)
async def upload_screenshot(
    trade_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a screenshot for a trade."""
    settings = get_settings()

    # Verify trade ownership
    trade = trades_col().find_one({"_id": ObjectId(trade_id)})
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    if str(trade["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Validate file extension
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Validate MIME type
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"MIME type not allowed. Allowed: {', '.join(ALLOWED_MIMES)}")

    # Read and validate size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")

    # Generate safe filename and save
    safe_name = f"{uuid.uuid4().hex}{ext.lower()}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Create screenshot document
    now = datetime.now(timezone.utc)
    ss_doc = {
        "user_id": ObjectId(current_user["id"]),
        "trade_id": ObjectId(trade_id),
        "file_name": safe_name,
        "file_path": file_path,
        "file_type": file.content_type,
        "file_size": len(content),
        "uploaded_at": now,
    }
    result = screenshots_col().insert_one(ss_doc)
    ss_doc["_id"] = result.inserted_id
    return _serialize_screenshot(ss_doc)


@router.get("/trades/{trade_id}/screenshots")
def get_screenshots(trade_id: str, current_user: dict = Depends(get_current_user)):
    """Get all screenshots for a trade."""
    trade = trades_col().find_one({"_id": ObjectId(trade_id)})
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    if str(trade["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    docs = list(screenshots_col().find({"trade_id": ObjectId(trade_id)}))
    return [_serialize_screenshot(ss) for ss in docs]


@router.delete("/screenshots/{screenshot_id}")
def delete_screenshot(screenshot_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a screenshot."""
    ss = screenshots_col().find_one({"_id": ObjectId(screenshot_id)})
    if not ss:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screenshot not found")
    if str(ss["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Remove file from disk
    try:
        os.remove(ss.get("file_path", ""))
    except OSError:
        pass

    screenshots_col().delete_one({"_id": ObjectId(screenshot_id)})
    return {"message": "Screenshot deleted"}
