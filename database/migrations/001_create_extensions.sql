-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 001: Enable Required PostgreSQL Extensions
-- ============================================================

-- Generate UUIDs natively
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS spatial types, functions, and indexes
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cryptographic functions (crypt, gen_salt, pgp_*, digest)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extensions loaded successfully
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'uuid-ossp extension failed to load';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'postgis extension failed to load';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension failed to load';
  END IF;
  RAISE NOTICE 'All extensions loaded successfully: uuid-ossp, postgis, pgcrypto';
END;
$$;
