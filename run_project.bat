@echo off
title SafeYatra Tourist Safety Platform - Launcher

cd /d "%~dp0"

echo ======================================================================
echo          SAFEYATRA - SMART TOURIST SAFETY PLATFORM
echo ======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH!
    echo Please install Node.js v18 or higher from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check Python
set PYTHON_CMD=
where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    ) else (
        echo [ERROR] Python is not installed or not found in PATH!
        echo Please install Python v3.9 or higher from https://www.python.org/
        echo.
        pause
        exit /b 1
    )
)

echo [*] Environment Checks:
echo     - Node.js: OK
echo     - Python:  OK [%PYTHON_CMD%]
echo.

:: 3. Check Frontend Dependencies
if not exist "frontend\node_modules" (
    echo [*] Frontend dependencies not found. Installing now...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
) else (
    echo [*] Frontend dependencies: OK
)

:: 4. Check Backend Dependencies
echo [*] Checking Backend Python Dependencies...
%PYTHON_CMD% -c "import fastapi, uvicorn, sqlalchemy, pydantic" >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] Installing missing Python backend dependencies...
    %PYTHON_CMD% -m pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo [WARNING] Failed to install some Python packages. Attempting to proceed...
    )
) else (
    echo [*] Backend dependencies: OK
)

echo.
:: 5. Launch Backend in a separate window
echo [*] Starting Python FastAPI Backend on port 8000...
start "SafeYatra - Python Backend :8000" cmd /k "cd /d "%~dp0backend" && title SafeYatra Backend :8000 && color 0B && echo ======================================== && echo   SAFEYATRA FASTAPI BACKEND :8000 && echo ======================================== && echo. && %PYTHON_CMD% -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: 6. Launch Frontend in a separate window
echo [*] Starting Frontend and Express Middleware on port 5009...
start "SafeYatra - Frontend App :5009" cmd /k "cd /d "%~dp0frontend" && title SafeYatra Frontend :5009 && color 0A && echo ======================================== && echo   SAFEYATRA FRONTEND AND EXPRESS :5009 && echo ======================================== && echo. && npm run dev"

:: 7. Wait briefly and open browser
echo.
echo [*] Starting services... Opening browser in 3 seconds...
ping 127.0.0.1 -n 4 >nul
start http://localhost:5009

echo.
echo ======================================================================
echo   SafeYatra Platform is now running!
echo ======================================================================
echo   - Web Application:    http://localhost:5009
echo   - FastAPI Backend:    http://localhost:8000
echo   - API Documentation:  http://localhost:8000/docs
echo   - Admin Portal:       http://localhost:5009/admin
echo ======================================================================
echo   Tip: Keep the server console windows open while using the app.
echo        To stop both servers, close their windows or run stop_project.bat
echo ======================================================================
echo.
pause
