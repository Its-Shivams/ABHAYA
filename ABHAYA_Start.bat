@echo off
title ABHAYA - Launch Application
color 0d
echo ======================================================
echo           ABHAYA WOMEN SAFETY PLATFORM
echo           Starting Backend and Web App
echo ======================================================
echo.

cd /d "%~dp0"

echo [*] Starting ABHAYA Backend API (Port 5000)...
start "ABHAYA Backend Server" cmd /k "cd /d "%~dp0backend" && npm start"

echo [*] Starting ABHAYA Web Application (Port 5173)...
start "ABHAYA Web Frontend" cmd /k "cd /d "%~dp0web" && npm run dev -- --host --port 5173"

timeout /t 3 /nobreak >nul

echo [*] Opening ABHAYA in browser...
start http://localhost:5173

echo.
color 0a
echo ======================================================
echo  ABHAYA is now running!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo ======================================================
echo.
pause
