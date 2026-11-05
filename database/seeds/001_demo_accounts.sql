-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Seed 001: Demo User Accounts
-- ============================================================
-- Requires: migrations 001 (pgcrypto), 002 (users, user_profiles, admin_users),
--           003 (trusted_contacts)
-- Run ONLY in development / staging environments.
-- ============================================================

BEGIN;

-- ─── Helper: idempotent insert guard ─────────────────────────
-- We use DO blocks so re-running the seed does not error on duplicates.

-- ─── 1. PRIYA SHARMA — Primary User ──────────────────────────
DO $$
DECLARE
  v_priya_id   UUID;
  v_priya_prof UUID;
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM users WHERE email = 'priya@abhaya.demo') THEN
    RAISE NOTICE 'Priya Sharma already exists — skipping.';
    RETURN;
  END IF;

  -- Insert core user
  INSERT INTO users (id, email, phone, password_hash, role, is_active, is_verified)
  VALUES (
    gen_random_uuid(),
    'priya@abhaya.demo',
    '+919876543210',
    crypt('Priya@123', gen_salt('bf', 12)),   -- bcrypt, cost 12
    'primary_user',
    TRUE,
    TRUE
  )
  RETURNING id INTO v_priya_id;

  -- Insert profile
  INSERT INTO user_profiles (user_id, full_name, abhaya_id, preferred_language, bio)
  VALUES (
    v_priya_id,
    'Priya Sharma',
    'ABHAYA-USER-1001',
    'en',
    'Delhi-based commuter using ABHAYA for safe daily navigation.'
  );

  RAISE NOTICE 'Priya Sharma created with id %', v_priya_id;
END;
$$;

-- ─── 2. RAHUL SHARMA — Trusted Contact ───────────────────────
DO $$
DECLARE
  v_rahul_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = 'rahul@abhaya.demo') THEN
    RAISE NOTICE 'Rahul Sharma already exists — skipping.';
    RETURN;
  END IF;

  INSERT INTO users (id, email, phone, password_hash, role, is_active, is_verified)
  VALUES (
    gen_random_uuid(),
    'rahul@abhaya.demo',
    '+919876543211',
    crypt('Rahul@123', gen_salt('bf', 12)),
    'trusted_contact',
    TRUE,
    TRUE
  )
  RETURNING id INTO v_rahul_id;

  INSERT INTO user_profiles (user_id, full_name, abhaya_id, preferred_language, bio)
  VALUES (
    v_rahul_id,
    'Rahul Sharma',
    'ABHAYA-USER-1002',
    'en',
    'Priya''s brother and primary emergency contact.'
  );

  RAISE NOTICE 'Rahul Sharma created with id %', v_rahul_id;
END;
$$;

-- ─── 3. ADMIN USER ───────────────────────────────────────────
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@abhaya.demo') THEN
    RAISE NOTICE 'Admin already exists — skipping.';
    RETURN;
  END IF;

  INSERT INTO users (id, email, phone, password_hash, role, is_active, is_verified)
  VALUES (
    gen_random_uuid(),
    'admin@abhaya.demo',
    '+919000000001',
    crypt('Admin@123!', gen_salt('bf', 12)),
    'admin',
    TRUE,
    TRUE
  )
  RETURNING id INTO v_admin_id;

  INSERT INTO user_profiles (user_id, full_name, abhaya_id, preferred_language)
  VALUES (v_admin_id, 'ABHAYA Admin', 'ABHAYA-USER-9001', 'en');

  INSERT INTO admin_users (user_id, permissions)
  VALUES (
    v_admin_id,
    '{
      "verify_reports"    : true,
      "manage_users"      : true,
      "view_analytics"    : true,
      "manage_facilities" : true,
      "manage_safety"     : true
    }'::jsonb
  );

  RAISE NOTICE 'Admin user created with id %', v_admin_id;
END;
$$;

-- ─── 4. TRUSTED CONTACT LINK (Priya ↔ Rahul, accepted) ───────
DO $$
DECLARE
  v_priya_id UUID;
  v_rahul_id UUID;
BEGIN
  SELECT id INTO v_priya_id FROM users WHERE email = 'priya@abhaya.demo';
  SELECT id INTO v_rahul_id FROM users WHERE email = 'rahul@abhaya.demo';

  IF v_priya_id IS NULL OR v_rahul_id IS NULL THEN
    RAISE WARNING 'Cannot create trusted_contact link — one or both demo users missing.';
    RETURN;
  END IF;

  -- Priya → Rahul (already accepted)
  INSERT INTO trusted_contacts (user_id, contact_user_id, status, invited_at, accepted_at)
  VALUES (
    v_priya_id,
    v_rahul_id,
    'accepted',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '9 days'
  )
  ON CONFLICT (user_id, contact_user_id) DO UPDATE
    SET status      = EXCLUDED.status,
        accepted_at = EXCLUDED.accepted_at;

  -- Rahul → Priya (mirror, also accepted)
  INSERT INTO trusted_contacts (user_id, contact_user_id, status, invited_at, accepted_at)
  VALUES (
    v_rahul_id,
    v_priya_id,
    'accepted',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days'
  )
  ON CONFLICT (user_id, contact_user_id) DO UPDATE
    SET status      = EXCLUDED.status,
        accepted_at = EXCLUDED.accepted_at;

  RAISE NOTICE 'Trusted contact link established between Priya and Rahul.';
END;
$$;

COMMIT;

-- ─── Verification query ───────────────────────────────────────
SELECT
  u.email,
  u.role,
  up.full_name,
  up.abhaya_id,
  up.preferred_language
FROM  users        u
JOIN  user_profiles up ON up.user_id = u.id
WHERE u.email IN ('priya@abhaya.demo', 'rahul@abhaya.demo', 'admin@abhaya.demo')
ORDER BY up.abhaya_id;
