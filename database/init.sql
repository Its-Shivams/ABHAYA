-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- init.sql — Master Initialization Script
-- ============================================================
-- Usage (psql):
--   psql -U abhaya_user -d abhaya_db -f d:\ABHAYA\database\init.sql
--
-- Or inside psql shell:
--   \i d:/ABHAYA/database/init.sql
--
-- NOTE: Use forward slashes even on Windows inside psql \i commands.
-- ============================================================

\echo '================================================='
\echo ' ABHAYA Database Initialization'
\echo ' Starting migrations...'
\echo '================================================='

-- ─── MIGRATIONS ──────────────────────────────────────────────
\echo '[001] Enabling extensions (uuid-ossp, postgis, pgcrypto)...'
\i migrations/001_create_extensions.sql

\echo '[002] Creating users, profiles, admin tables...'
\i migrations/002_create_users.sql

\echo '[003] Creating trusted contacts and connection requests...'
\i migrations/003_create_contacts.sql

\echo '[004] Creating journeys and live location tracking...'
\i migrations/004_create_journeys.sql

\echo '[005] Creating road segments and safety scoring tables...'
\i migrations/005_create_safety.sql

\echo '[006] Creating incidents table...'
\i migrations/006_create_incidents.sql

\echo '[007] Creating community reports, posts and comments...'
\i migrations/007_create_community.sql

\echo '[008] Creating emergency sessions and events...'
\i migrations/008_create_emergency.sql

\echo '[009] Creating notifications table...'
\i migrations/009_create_notifications.sql

\echo '[010] Creating nearby facilities...'
\i migrations/010_create_facilities.sql

\echo '================================================='
\echo ' All migrations complete.'
\echo ' Loading seed data...'
\echo '================================================='

-- ─── SEEDS ───────────────────────────────────────────────────
\echo '[SEED 001] Demo user accounts (Priya, Rahul, Admin)...'
\i seeds/001_demo_accounts.sql

\echo '[SEED 002] Demo road segments and safety scores (Uttam Nagar / Vikaspuri)...'
\i seeds/002_demo_safety_data.sql

\echo '[SEED 003] Demo community posts, reports and facilities...'
\i seeds/003_demo_community.sql

\echo '[SEED 004] Demo journey for Priya Sharma...'
\i seeds/004_demo_journeys.sql

\echo '================================================='
\echo ' ABHAYA database initialization COMPLETE.'
\echo '================================================='

-- ─── QUICK HEALTH CHECK ──────────────────────────────────────
\echo ''
\echo 'Health check — table row counts:'

SELECT 'users'               AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'user_profiles',                      COUNT(*) FROM user_profiles
UNION ALL
SELECT 'trusted_contacts',                   COUNT(*) FROM trusted_contacts
UNION ALL
SELECT 'road_segments',                      COUNT(*) FROM road_segments
UNION ALL
SELECT 'safety_scores',                      COUNT(*) FROM safety_scores
UNION ALL
SELECT 'community_posts',                    COUNT(*) FROM community_posts
UNION ALL
SELECT 'community_reports',                  COUNT(*) FROM community_reports
UNION ALL
SELECT 'nearby_facilities',                  COUNT(*) FROM nearby_facilities
UNION ALL
SELECT 'journeys',                           COUNT(*) FROM journeys
UNION ALL
SELECT 'live_locations',                     COUNT(*) FROM live_locations
UNION ALL
SELECT 'notifications',                      COUNT(*) FROM notifications
ORDER BY table_name;
