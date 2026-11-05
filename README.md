# 🛡️ ABHAYA (अभया) — Women's Safety & Smart Navigation Platform

> **"Your Safety, Your Journey, Your Control"**  
> **"आपकी सुरक्षा, आपकी यात्रा, आपका नियंत्रण"**

A comprehensive, production-structured women's safety platform built with an intelligent **Safety Scoring Engine**, dynamic **Community Hazard Reclassification**, real-time **Live Journey Sharing**, emergency **SOS with 3-second hold prevention**, a **Smart Public Network** of nearby facilities, and bilingual **Voice Commands** (English & Hindi).

---

## 🚀 Live Services Running

| Service | Port / URL | Status | Description |
|---|---|---|---|
| **Web Application** | `http://localhost:5173` | **LIVE (HTTP 200)** | Full React + Vite + Tailwind CSS Web Platform |
| **Backend API** | `http://localhost:5000` | **LIVE (HTTP 200)** | Node.js + Express + TypeScript + Socket.IO |
| **Database Migrations** | `database/` | Ready | 10 PostgreSQL/PostGIS migrations + 4 demo seed scripts |

---

## 🔑 Quick Demo Login Credentials

On the sign-in screen at `http://localhost:5173`, you can use the **1-Click Demo Buttons** or sign in with:

| Account | Role | Email | Password | ABHAYA ID |
|---|---|---|---|---|
| **Priya Sharma** | Primary User | `priya@abhaya.demo` | `Priya@123` | `ABHAYA-USER-1001` |
| **Rahul Sharma** | Trusted Contact | `rahul@abhaya.demo` | `Rahul@123` | `ABHAYA-USER-1002` |
| **Admin Moderator** | Safety Moderator | `admin@abhaya.demo` | `Admin@123` | `ABHAYA-ADMIN-0001` |

---

## 🌟 Core Modules & Innovation

### 1. 🛡️ Smart Safe Route Navigation (Core Innovation)
Unlike conventional navigation apps that only calculate the shortest distance, ABHAYA's **Safety Intelligence Engine** evaluates road segments using a **7-parameter weighted algorithm**:
- **Historical Incidents (25%)**
- **Streetlight Coverage (20%)**
- **Public Activity & Crowd Footfall (15%)**
- **Community Safety Reports (15%)**
- **CCTV Surveillance (10%)**
- **Police Accessibility & Pink Booths (10%)**
- **Hospital / Emergency Access (5%)**

Roads are categorized into:
- 🟢 **Zone A (75–100)**: Safe Corridor (High footfall, well-lit, active police presence)
- 🟡 **Zone B (45–74)**: Moderate Caution (Intermittent lighting or reported obstacles)
- 🔴 **Zone C (0–44)**: Higher Risk (Dark stretches, zero CCTV, isolated lanes)

### 2. ⚡ Dynamic Community-Based Safety Reclassification
- Citizens report unsafe locations (e.g. broken streetlights on Pankha Road, dark culverts, harassment).
- When a safety moderator verifies the report in the **Safety Admin Panel**, the system **dynamically recalculates the road segment's safety score**, shifts the Zone classification (e.g., from Zone A to Zone B), logs the change in the **Safety Audit Trail**, and updates future route recommendations in real-time!

### 3. 🚨 Emergency SOS System (with 3-Second Hold Prevention)
- Prominent SOS button accessible throughout the interface.
- **3-second hold countdown ring** prevents accidental dispatch while ensuring immediate help when needed.
- Instant alert dispatched to **Rahul Sharma** (Trusted Contact) with live GPS coordinates.
- Provides immediate 1-click speed dials for **112 (Police PCR)**, **1091 (Women Helpline)**, **100**, and the nearest verified police station and hospital.
- "Mark Emergency Resolved" workflow.

### 4. 📍 Real-Time Live Journey Sharing
- Share live GPS tracking with authorized trusted contacts.
- Real-time route progress bar, ETA countdown, and device battery level monitoring.
- "I Have Reached Safely" one-tap safe check-in.

### 5. 🏥 Smart Public Network (Nearby Help)
- Direct directory and map visualization of:
  - 👮 **Police Stations** (e.g., Uttam Nagar Police Station - 350m)
  - 🏥 **Hospitals & Trauma Centers** (e.g., Mata Chanan Devi Hospital - 1.8km)
  - 💊 **24/7 Pharmacies**
  - 🚇 **Metro Stations (Designated Safe Havens)**
- Verified phone numbers with 1-click dial and navigation directions.

### 6. 🎙️ Bilingual Voice Command Assistant (English & Hindi)
- Supports Web Speech Recognition and Speech Synthesis.
- English Commands:
  - *"Find safe route to Vikaspuri"*
  - *"Share my journey"*
  - *"Activate emergency SOS"*
  - *"Show nearby police stations"*
- Hindi Commands:
  - *"Vikaspuri ka safe route dikhao"*
  - *"Meri journey share karo"*
  - *"Emergency SOS activate karo"*
  - *"Paas ka police station dikhao"*

### 7. 👥 Trusted Contact Guardian Portal
- Personalized view for **Rahul Sharma**.
- Allows observing Priya's live GPS journey only when authorized (protecting digital privacy).
- Displays high-priority emergency sirens and direct call actions if an SOS is triggered.

---

## 🎨 Theme & Design Philosophy

- **Primary**: Deep Purple (`#673AB7`) — Trust, vigilance, empowerment.
- **Secondary**: Soft Pink (`#E8A0BF`) — Gentle accent only.
- **Background**: Very Light Grey (`#F7F7FA`) — Clean, readable, accessible.
- **Safety Zones**:
  - Zone A: Green (`#2E9D64`)
  - Zone B: Amber (`#E5A000`)
  - Zone C: Red (`#D93636`)

---

## 💻 1-Click Launch Instructions

To launch both the backend and web server anytime:

```powershell
# From the project root d:\ABHAYA
.\start-abhaya.ps1
```

Or run them individually:

### Backend:
```bash
cd d:\ABHAYA\backend
npm start
# Runs at http://localhost:5000
```

### Web Frontend:
```bash
cd d:\ABHAYA\web
npm run dev
# Runs at http://localhost:5173
```

---

## 📂 Project Directory Structure

```
d:\ABHAYA\
├── start-abhaya.ps1            # 1-click launch script
├── web/                        # React + Vite + Tailwind CSS Web Application
│   ├── src/
│   │   ├── components/         # Navbar, MapComponent, SOSModal, VoiceAssistantModal
│   │   ├── context/            # AuthContext, LanguageContext
│   │   ├── locales/            # translations.ts (English & Hindi)
│   │   ├── pages/              # Dashboard, SafeRoutes, Journey, Community, NearbyHelp,
│   │   │                       # TrustedDashboard, AdminModeration, Profile, Auth
│   │   ├── services/           # api.ts (REST client with offline/mock fallback)
│   │   └── types/              # TypeScript interface catalog
│   └── package.json
├── backend/                    # Node.js + Express + TypeScript Backend API
│   ├── src/
│   │   ├── controllers/        # auth, user, contact, route, journey, emergency, community, facility, admin
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # store.ts (Runtime state + dynamic scoring engine)
│   │   ├── sockets/            # Socket.IO live journey and emergency tracking
│   │   ├── utils/              # safetyScoring.ts, geoUtils.ts, demoData.ts
│   │   └── index.ts            # Server entry point (Port 5000)
│   └── package.json
├── database/                   # PostgreSQL + PostGIS SQL Scripts
│   ├── migrations/             # 001_create_extensions.sql ... 010_create_facilities.sql
│   ├── seeds/                  # 001_demo_accounts.sql ... 004_demo_journeys.sql
│   └── init.sql
└── README.md
```

---
*Built with care for women's safety, privacy, and smart navigation.*
