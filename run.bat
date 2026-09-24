@echo off
title TradeJournal Server

echo ==========================================
echo        TradeJournal - Starting Server
echo ==========================================
echo.

:: Navigate to the project directory
cd /d "%~dp0"

:: Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found.
    echo Run: python -m venv venv
    echo Then: venv\Scripts\activate ^& pip install -r requirements.txt
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat

echo [OK] Virtual environment activated.
echo [..] Starting FastAPI server on http://127.0.0.1:8000
echo [..] Frontend at http://127.0.0.1:8000/frontend/index.html
echo.
echo Press Ctrl+C to stop the server.
echo ==========================================
echo.

:: Run the FastAPI app with uvicorn
:: --app-dir is set to project root so "backend.main:app" resolves correctly
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

pause
