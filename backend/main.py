from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.database import create_indexes
from backend.routes.auth_routes import router as auth_router
from backend.routes.daily_routes import router as daily_router
from backend.routes.trade_routes import router as trade_router
from backend.routes.upload_routes import router as upload_router
from backend.routes.analytics_routes import router as analytics_router
from backend.routes.report_routes import router as report_router

app = FastAPI(
    title="TradeJournal API",
    description="API for TradeJournal personal trading journal",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory for serving screenshots
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount frontend directory for serving the web app
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

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
    return RedirectResponse(url="/frontend/")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
