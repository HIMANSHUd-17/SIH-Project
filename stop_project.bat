@echo off
title Stopping SafeYatra Platform

echo ======================================================================
echo          STOPPING SAFEYATRA RUNNING PROCESSES
echo ======================================================================
echo.

:: Kill processes on port 8000 (FastAPI Backend)
echo [*] Terminating Python FastAPI Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

:: Kill processes on port 5009 (Frontend App & Express)
echo [*] Terminating Node/Frontend Server (Port 5009)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5009" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo [OK] All SafeYatra server processes have been stopped.
echo.
timeout /t 3 >nul
