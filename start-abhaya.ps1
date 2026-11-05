# ============================================================
# d:\ABHAYA\start-abhaya.ps1
# 1-Click Launch Script for ABHAYA Women Safety Platform
# Starts Backend API (Port 5000) and Web Application (Port 5173)
# ============================================================

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "🛡️  STARTING ABHAYA: WOMEN SAFETY & SMART NAVIGATION" -ForegroundColor Yellow
Write-Host "   Tagline: Your Safety, Your Journey, Your Control" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta

# 1. Start Backend API in a separate background window
Write-Host "`n[1/2] Starting Node.js / Express Backend on http://localhost:5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\ABHAYA\backend'; Write-Host '🛡️ ABHAYA Backend Server Running...' -ForegroundColor Magenta; npm start"

# Brief pause
Start-Sleep -Seconds 3

# 2. Start Web Frontend
Write-Host "[2/2] Starting React + Vite Web Application on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\ABHAYA\web'; Write-Host '🛡️ ABHAYA Web App Running...' -ForegroundColor Cyan; npm run dev -- --host --port 5173"

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host "`n✅ ABHAYA Platform is live!" -ForegroundColor Green
Write-Host "🌐 Web Application: http://localhost:5173" -ForegroundColor Yellow
Write-Host "📡 Backend API:     http://localhost:5000" -ForegroundColor Yellow
Write-Host "`nDemo Accounts available on the Sign-In screen:" -ForegroundColor Cyan
Write-Host "  1. Priya Sharma (Primary User):  priya@abhaya.demo / Priya@123"
Write-Host "  2. Rahul Sharma (Trusted Contact): rahul@abhaya.demo / Rahul@123"
Write-Host "  3. Admin Moderator:              admin@abhaya.demo / Admin@123"
Write-Host "`nPress Enter to exit this launcher window (servers will remain active in their windows)."
Read-Host
