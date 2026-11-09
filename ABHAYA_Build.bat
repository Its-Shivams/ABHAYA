@echo off
title ABHAYA - Build Application
color 0b
echo ======================================================
echo           ABHAYA WOMEN SAFETY PLATFORM
echo              Building Project Packages
echo ======================================================
echo.

cd /d "%~dp0"

echo [1/2] Building Backend Service (TypeScript)...
call npm run build --prefix backend
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Backend build failed!
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Building Web Frontend (Vite + React)...
call npm run build --prefix web
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Web frontend build failed!
    echo.
    pause
    exit /b %errorlevel%
)

echo.
color 0a
echo ======================================================
echo       SUCCESS: ABHAYA BUILD COMPLETED CLEANLY!
echo ======================================================
echo.
pause
