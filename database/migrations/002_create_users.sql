-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 002: Users, Profiles, Admin
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('primary_user', 'trusted_contact', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE preferred_language AS ENUM ('en', 'hi');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20)     NOT NULL UNIQUE,
    password_hash   TEXT            NOT NULL,
    role            user_role       NOT NULL DEFAULT 'primary_user',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_format CHECK (phone ~ '^\+?[0-9]{7,15}$')
);

-- Indexes on users
CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone     ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active) WHERE is_active = TRUE;

COMMENT ON TABLE  users                IS 'Core authentication table for all ABHAYA platform users';
COMMENT ON COLUMN users.id             IS 'UUID primary key';
COMMENT ON COLUMN users.email          IS 'Unique login email address';
COMMENT ON COLUMN users.phone          IS 'Unique phone number including country code';
COMMENT ON COLUMN users.password_hash  IS 'Bcrypt hash via pgcrypto crypt()';
COMMENT ON COLUMN users.role           IS 'Platform role: primary_user | trusted_contact | admin';

-- ─── TABLE: user_profiles ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    full_name           VARCHAR(150)    NOT NULL,
    profile_picture_url TEXT,
    abhaya_id           VARCHAR(20)     NOT NULL UNIQUE,
    preferred_language  preferred_language NOT NULL DEFAULT 'en',
    bio                 TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT up_abhaya_id_format CHECK (abhaya_id ~ '^ABHAYA-USER-[0-9]{4,}$')
);

-- Indexes on user_profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_up_user_id   ON user_profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_up_abhaya_id ON user_profiles (abhaya_id);
CREATE        INDEX IF NOT EXISTS idx_up_full_name ON user_profiles (full_name);

COMMENT ON TABLE  user_profiles           IS 'Extended profile information for each user';
COMMENT ON COLUMN user_profiles.abhaya_id IS 'Platform-wide unique display ID, format: ABHAYA-USER-XXXX';

-- ─── TABLE: admin_users ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    permissions JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT au_role_check CHECK (
        (SELECT role FROM users u WHERE u.id = user_id) = 'admin'
    )
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id     ON admin_users (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_permissions ON admin_users USING GIN (permissions);

COMMENT ON TABLE  admin_users             IS 'Admin-only extended data and permission grants';
COMMENT ON COLUMN admin_users.permissions IS 'JSON map of permission keys to boolean/config values';

-- ─── TRIGGER: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at         ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
