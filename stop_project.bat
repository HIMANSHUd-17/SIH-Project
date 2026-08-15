@echo off
title Stop SafeYatra Platform
echo ======================================================================
echo          STOPPING SAFEYATRA PLATFORM PROCESSES
echo ======================================================================
echo.

echo [*] Terminating processes on Port 5009 (Frontend/Express)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5009" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo [*] Terminating processes on Port 8000 (FastAPI Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [DONE] SafeYatra services stopped successfully.
echo.
pause
