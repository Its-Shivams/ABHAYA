# ABHAYA Database — Setup & Operations Guide

> **ABHAYA — Women's Safety & Smart Navigation Platform**
> PostgreSQL 15+ with PostGIS 3.x spatial extension

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install PostgreSQL & PostGIS](#2-install-postgresql--postgis)
3. [Create the Database](#3-create-the-database)
4. [Connection String Format](#4-connection-string-format)
5. [Run Migrations](#5-run-migrations)
6. [Run Seed Data](#6-run-seed-data)
7. [Run Everything at Once (init.sql)](#7-run-everything-at-once-initsql)
8. [Schema Overview](#8-schema-overview)
9. [Spatial Query Examples](#9-spatial-query-examples)
10. [Roles & Permissions](#10-roles--permissions)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

| Requirement | Minimum Version |
|---|---|
| PostgreSQL | **15.x** or later |
| PostGIS | **3.3** or later |
| psql CLI | Bundled with PostgreSQL |
| pgcrypto | Bundled with PostgreSQL (contrib) |

---

## 2. Install PostgreSQL & PostGIS

### Windows

```powershell
# Option A — EnterpriseDB installer (recommended for Windows)
# Download from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
# During installation, check "Stack Builder" and select PostGIS from Spatial Extensions

# Option B — via Chocolatey
choco install postgresql15 --params '/Password:your_pg_password'
choco install postgis
```

After installation, add PostgreSQL bin to your PATH:

```powershell
$env:PATH += ";C:\Program Files\PostgreSQL\15\bin"
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y postgresql-15 postgresql-15-postgis-3
sudo systemctl enable --now postgresql
```

### macOS (Homebrew)

```bash
brew install postgresql@15 postgis
brew services start postgresql@15
```

---

## 3. Create the Database

Connect as the postgres superuser and create the ABHAYA database and role:

```sql
-- Connect as superuser
psql -U postgres

-- Create dedicated role
CREATE ROLE abhaya_user WITH LOGIN PASSWORD 'your_secure_password_here';

-- Create database owned by role
CREATE DATABASE abhaya_db
  OWNER       abhaya_user
  ENCODING    'UTF8'
  LC_COLLATE  'en_US.UTF-8'
  LC_CTYPE    'en_US.UTF-8'
  TEMPLATE    template0;

-- Grant superuser temporarily to install PostGIS extensions
-- (PostGIS requires superuser for CREATE EXTENSION)
ALTER ROLE abhaya_user SUPERUSER;

-- Connect to the new database
\c abhaya_db

-- After running migrations, revoke superuser:
-- ALTER ROLE abhaya_user NOSUPERUSER;
```

> [!IMPORTANT]
> `CREATE EXTENSION postgis` requires **superuser** or the `pg_extension_owner` role in PostgreSQL 15+. Grant it temporarily, run migrations, then revoke it.

---

## 4. Connection String Format

### Standard URI format

```
postgresql://abhaya_user:your_secure_password_here@localhost:5432/abhaya_db
```

### Component breakdown

| Component | Value |
|---|---|
| Host | `localhost` (or remote IP/hostname) |
| Port | `5432` (default) |
| Database | `abhaya_db` |
| User | `abhaya_user` |
| Password | *(your chosen password)* |
| SSL mode | `require` (production) / `disable` (local dev) |

### Application `.env` example

```env
DATABASE_URL=postgresql://abhaya_user:your_secure_password_here@localhost:5432/abhaya_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=abhaya_db
DATABASE_USER=abhaya_user
DATABASE_PASSWORD=your_secure_password_here
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

---

## 5. Run Migrations

Migrations must be run **in order** (001 → 010). Each migration is idempotent (`IF NOT EXISTS` / `DO NOTHING`).

```powershell
# From d:\ABHAYA\database directory
cd d:\ABHAYA\database

# Run individual migrations in order
psql -U abhaya_user -d abhaya_db -f migrations/001_create_extensions.sql
psql -U abhaya_user -d abhaya_db -f migrations/002_create_users.sql
psql -U abhaya_user -d abhaya_db -f migrations/003_create_contacts.sql
psql -U abhaya_user -d abhaya_db -f migrations/004_create_journeys.sql
psql -U abhaya_user -d abhaya_db -f migrations/005_create_safety.sql
psql -U abhaya_user -d abhaya_db -f migrations/006_create_incidents.sql
psql -U abhaya_user -d abhaya_db -f migrations/007_create_community.sql
psql -U abhaya_user -d abhaya_db -f migrations/008_create_emergency.sql
psql -U abhaya_user -d abhaya_db -f migrations/009_create_notifications.sql
psql -U abhaya_user -d abhaya_db -f migrations/010_create_facilities.sql
```

> [!TIP]
> Use the `PGPASSWORD` environment variable to avoid password prompts in scripts:
> ```powershell
> $env:PGPASSWORD = "your_secure_password_here"
> ```

---

## 6. Run Seed Data

Seed scripts are designed for **development and staging only**. They are idempotent — safe to re-run.

```powershell
psql -U abhaya_user -d abhaya_db -f seeds/001_demo_accounts.sql
psql -U abhaya_user -d abhaya_db -f seeds/002_demo_safety_data.sql
psql -U abhaya_user -d abhaya_db -f seeds/003_demo_community.sql
psql -U abhaya_user -d abhaya_db -f seeds/004_demo_journeys.sql
```

### Demo credentials

| User | Email | Password | Role |
|---|---|---|---|
| Priya Sharma | `priya@abhaya.demo` | `Priya@123` | primary_user |
| Rahul Sharma | `rahul@abhaya.demo` | `Rahul@123` | trusted_contact |
| Admin | `admin@abhaya.demo` | `Admin@123!` | admin |

> [!CAUTION]
> **Never run seed files in production.** They insert predictable demo credentials that are a security risk.

---

## 7. Run Everything at Once (init.sql)

The [`init.sql`](file:///d:/ABHAYA/database/init.sql) master script runs all migrations and seeds in the correct order:

```powershell
# From d:\ABHAYA\database directory
cd d:\ABHAYA\database

psql -U abhaya_user -d abhaya_db -f init.sql
```

Or inside an interactive psql session:

```sql
-- psql uses forward slashes even on Windows
\cd d:/ABHAYA/database
\i init.sql
```

---

## 8. Schema Overview

```mermaid
erDiagram
    users ||--o| user_profiles : "has"
    users ||--o| admin_users : "may be"
    users ||--o{ trusted_contacts : "owns"
    users ||--o{ journeys : "takes"
    users ||--o{ community_reports : "files"
    users ||--o{ community_posts : "writes"
    users ||--o{ emergency_sessions : "activates"
    users ||--o{ notifications : "receives"

    journeys ||--o{ live_locations : "tracks"
    journeys ||--o{ journey_contacts : "shares with"

    road_segments ||--o{ safety_indicators : "measured by"
    road_segments ||--o{ safety_scores : "scored as"
    road_segments ||--o{ safety_history : "logged in"
    road_segments ||--o{ incidents : "has"

    community_reports ||--o{ report_verifications : "reviewed via"
    community_posts ||--o{ community_comments : "has"

    emergency_sessions ||--o{ emergency_events : "contains"
```

### Migration files

| File | Tables Created |
|---|---|
| [`001_create_extensions.sql`](file:///d:/ABHAYA/database/migrations/001_create_extensions.sql) | Extensions only |
| [`002_create_users.sql`](file:///d:/ABHAYA/database/migrations/002_create_users.sql) | `users`, `user_profiles`, `admin_users` |
| [`003_create_contacts.sql`](file:///d:/ABHAYA/database/migrations/003_create_contacts.sql) | `trusted_contacts`, `connection_requests` |
| [`004_create_journeys.sql`](file:///d:/ABHAYA/database/migrations/004_create_journeys.sql) | `journeys`, `live_locations`, `journey_contacts` |
| [`005_create_safety.sql`](file:///d:/ABHAYA/database/migrations/005_create_safety.sql) | `road_segments`, `safety_indicators`, `safety_scores`, `safety_history` |
| [`006_create_incidents.sql`](file:///d:/ABHAYA/database/migrations/006_create_incidents.sql) | `incidents` |
| [`007_create_community.sql`](file:///d:/ABHAYA/database/migrations/007_create_community.sql) | `community_reports`, `report_verifications`, `community_posts`, `community_comments` |
| [`008_create_emergency.sql`](file:///d:/ABHAYA/database/migrations/008_create_emergency.sql) | `emergency_sessions`, `emergency_events` |
| [`009_create_notifications.sql`](file:///d:/ABHAYA/database/migrations/009_create_notifications.sql) | `notifications` |
| [`010_create_facilities.sql`](file:///d:/ABHAYA/database/migrations/010_create_facilities.sql) | `nearby_facilities` |

---

## 9. Spatial Query Examples

All spatial data uses **SRID 4326** (WGS-84 lat/lon).

### Find facilities within 1 km of a user's location

```sql
SELECT name, facility_type, address,
       ST_Distance(
         location::geography,
         ST_SetSRID(ST_MakePoint(77.0588, 28.6212), 4326)::geography
       ) AS distance_metres
FROM nearby_facilities
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(77.0588, 28.6212), 4326)::geography,
  1000           -- 1000 metres
)
AND is_verified = TRUE
ORDER BY distance_metres;
```

### Get safety score for road segments near a point

```sql
SELECT rs.segment_name, ss.overall_score, ss.zone_class
FROM road_segments rs
JOIN safety_scores ss ON ss.road_segment_id = rs.id AND ss.is_current = TRUE
WHERE ST_DWithin(
  rs.geometry::geography,
  ST_SetSRID(ST_MakePoint(77.0540, 28.6190), 4326)::geography,
  500
)
ORDER BY ss.overall_score DESC;
```

### Get current live location of a journey

```sql
SELECT ST_Y(location) AS lat, ST_X(location) AS lng, timestamp, battery_level
FROM live_locations
WHERE journey_id = '44444444-4444-4444-4444-444444444001'
ORDER BY timestamp DESC
LIMIT 1;
```

---

## 10. Roles & Permissions

After initial setup, revoke superuser and apply fine-grained permissions:

```sql
-- Revoke temporary superuser
ALTER ROLE abhaya_user NOSUPERUSER;

-- Create a read-only analytics role
CREATE ROLE abhaya_readonly WITH LOGIN PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE abhaya_db TO abhaya_readonly;
GRANT USAGE ON SCHEMA public TO abhaya_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO abhaya_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO abhaya_readonly;

-- Backend application role (no DDL)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO abhaya_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO abhaya_user;
```

---

## 11. Troubleshooting

### PostGIS extension fails to install

```
ERROR: could not open extension control file ".../postgis.control": No such file or directory
```

**Fix:** Install the PostGIS package for your PostgreSQL version:
- Windows: Re-run Stack Builder → Spatial Extensions → PostGIS
- Ubuntu: `sudo apt install postgresql-15-postgis-3`

### `crypt()` function not found

```
ERROR: function crypt(text, text) does not exist
```

**Fix:** Run migration 001 first to enable pgcrypto:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Geometry column errors

```
ERROR: function st_setsrid(geometry, integer) does not exist
```

**Fix:** PostGIS is not installed or not enabled on this database. Run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Reset and re-initialize (development only)

```sql
-- WARNING: Destroys all data
DROP DATABASE IF EXISTS abhaya_db;
CREATE DATABASE abhaya_db OWNER abhaya_user ENCODING 'UTF8' TEMPLATE template0;
```

Then re-run `init.sql`.

---

*Generated for ABHAYA Platform — © 2024 ABHAYA Development Team*
