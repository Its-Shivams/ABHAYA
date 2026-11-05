-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 006: Incidents
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: incidents ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
    id            UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id    UUID                NOT NULL REFERENCES road_segments (id) ON DELETE CASCADE,
    reported_by   UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    incident_type VARCHAR(100)        NOT NULL,
    description   TEXT,
    location      GEOMETRY(Point, 4326) NOT NULL,
    occurred_at   TIMESTAMPTZ         NOT NULL,
    severity      incident_severity   NOT NULL DEFAULT 'medium',
    is_verified   BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT inc_occurred_not_future CHECK (occurred_at <= NOW() + INTERVAL '5 minutes')
);

-- Spatial index on incident location
CREATE INDEX IF NOT EXISTS idx_inc_location    ON incidents USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_inc_segment_id  ON incidents (segment_id);
CREATE INDEX IF NOT EXISTS idx_inc_reported_by ON incidents (reported_by);
CREATE INDEX IF NOT EXISTS idx_inc_severity    ON incidents (severity);
CREATE INDEX IF NOT EXISTS idx_inc_is_verified ON incidents (is_verified);
CREATE INDEX IF NOT EXISTS idx_inc_occurred_at ON incidents (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_inc_type        ON incidents (incident_type);

-- Composite index for hotspot queries
CREATE INDEX IF NOT EXISTS idx_inc_segment_severity ON incidents (segment_id, severity, occurred_at DESC);

COMMENT ON TABLE  incidents               IS 'User-reported and system-detected safety incidents on road segments';
COMMENT ON COLUMN incidents.incident_type IS 'Free-text category: theft, harassment, accident, poor_lighting, etc.';
COMMENT ON COLUMN incidents.location      IS 'Exact GPS point of incident in WGS-84 (SRID 4326)';
COMMENT ON COLUMN incidents.occurred_at   IS 'When the incident occurred (not necessarily when reported)';
COMMENT ON COLUMN incidents.is_verified   IS 'TRUE once an admin has verified the report';
