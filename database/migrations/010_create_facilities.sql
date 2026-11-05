-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 010: Nearby Facilities
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE facility_type AS ENUM (
    'police', 'hospital', 'pharmacy', 'metro', 'bus_stop', 'taxi'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: nearby_facilities ─────────────────────────────────
CREATE TABLE IF NOT EXISTS nearby_facilities (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(255)    NOT NULL,
    facility_type    facility_type   NOT NULL,
    location         GEOMETRY(Point, 4326) NOT NULL,
    address          TEXT,
    phone            VARCHAR(30),
    is_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
    google_place_id  VARCHAR(100)    UNIQUE,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT nf_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]{7,25}$')
);

-- Spatial index — primary query pattern: ST_DWithin(location, user_point, radius)
CREATE INDEX IF NOT EXISTS idx_nf_location          ON nearby_facilities USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_nf_facility_type     ON nearby_facilities (facility_type);
CREATE INDEX IF NOT EXISTS idx_nf_is_verified       ON nearby_facilities (is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_nf_google_place_id   ON nearby_facilities (google_place_id);

-- Composite spatial+type index for typed proximity queries
CREATE INDEX IF NOT EXISTS idx_nf_type_location     ON nearby_facilities USING GIST (location)
    WHERE facility_type IN ('police', 'hospital');

COMMENT ON TABLE  nearby_facilities                IS 'Static registry of safety-relevant facilities near user locations';
COMMENT ON COLUMN nearby_facilities.google_place_id IS 'Google Maps Place ID for deduplication and enrichment';
COMMENT ON COLUMN nearby_facilities.is_verified     IS 'TRUE once admin has confirmed facility details are accurate';

-- ─── HELPER VIEW: active verified facilities ──────────────────
CREATE OR REPLACE VIEW verified_facilities AS
SELECT  id, name, facility_type,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        address, phone, google_place_id, created_at
FROM    nearby_facilities
WHERE   is_verified = TRUE;

COMMENT ON VIEW verified_facilities IS 'Convenience view exposing only verified facilities with lat/lon columns';
