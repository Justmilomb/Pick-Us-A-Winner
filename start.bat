@echo off
cd /d "%~dp0"
title Giveaway Engine
cls

echo ---------------------------------------------------
echo      GIVEAWAY ENGINE - LAUNCHER
echo ---------------------------------------------------

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit
)

:: Check for node_modules
if not exist "node_modules\" (
    echo [INFO] First run detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit
    )
)

echo [INFO] Starting Application...
echo [INFO] The browser will open automatically when ready (approx 5-10s).

:: Open Browser in parallel (wait a bit then open)
start /b cmd /c "timeout /t 8 >nul & start http://localhost:5000"

:: Start Server
call npm run dev

:: If server crashes, keep window open
echo.
echo [WARN] Server stopped unexpectedly.
pause
