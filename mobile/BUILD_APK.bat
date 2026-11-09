@echo off
title ABHAYA Android APK Builder
color 0b
echo ========================================================
echo             ABHAYA MOBILE APP - APK BUILDER
echo ========================================================
echo.
echo Navigating to mobile directory...
cd /d "%~dp0"

echo.
echo Starting EAS Cloud Build for Android (.apk)...
echo NOTE: If prompted "Generate a new Android Keystore?", type Y and press Enter.
echo.
npx eas-cli build -p android --profile preview

echo.
pause
