from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
import os

from backend.config import get_settings
from backend.database import create_indexes, get_database
from backend.routes.auth_routes import router as auth_router
from backend.routes.daily_routes import router as daily_router
from backend.routes.trade_routes import router as trade_router
from backend.routes.upload_routes import router as upload_router
from backend.routes.analytics_routes import router as analytics_router
from backend.routes.report_routes import router as report_router

settings = get_settings()

app = FastAPI(
    title="TradeJournal API",
    description="API for TradeJournal personal trading journal",
    version="1.0.0",
)


# Custom CORS middleware — manually adds headers to every response
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            response = Response(status_code=200)
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response

        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response


app.add_middleware(CORSMiddleware)

# Mount upload directory for serving screenshots
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register API routers
app.include_router(auth_router)
app.include_router(daily_router)
app.include_router(trade_router)
app.include_router(upload_router)
app.include_router(analytics_router)
app.include_router(report_router)


@app.on_event("startup")
def startup():
    create_indexes()


@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url=settings.FRONTEND_URL)


@app.get("/health")
async def health_check():
    """Health check endpoint used by Render to verify the service is running."""
    try:
        db = get_database()
        db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return JSONResponse(content={
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "tradejournal-api",
        "database": db_status,
    })
