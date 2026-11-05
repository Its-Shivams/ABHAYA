-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 008: Emergency Sessions & Events
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE emergency_status AS ENUM ('active', 'resolved', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: emergency_sessions ───────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_sessions (
    id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID              NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    location     GEOMETRY(Point, 4326) NOT NULL,
    status       emergency_status  NOT NULL DEFAULT 'active',
    activated_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    resolved_at  TIMESTAMPTZ,
    notes        TEXT,
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    CONSTRAINT es_resolved_after_activated CHECK (
        resolved_at IS NULL OR resolved_at >= activated_at
    )
);

-- Spatial index on initial emergency location
CREATE INDEX IF NOT EXISTS idx_es_location      ON emergency_sessions USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_es_user_id       ON emergency_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_es_status        ON emergency_sessions (status);
CREATE INDEX IF NOT EXISTS idx_es_active        ON emergency_sessions (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_es_activated_at  ON emergency_sessions (activated_at DESC);

COMMENT ON TABLE  emergency_sessions            IS 'SOS emergency sessions activated by users in distress';
COMMENT ON COLUMN emergency_sessions.location   IS 'GPS location at the moment SOS was activated';
COMMENT ON COLUMN emergency_sessions.notes      IS 'Admin or system notes on how the emergency was resolved';

-- ─── TABLE: emergency_events ─────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_events (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID        NOT NULL REFERENCES emergency_sessions (id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    data       JSONB       NOT NULL DEFAULT '{}',
    location   GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index on event location (optional ping updates)
CREATE INDEX IF NOT EXISTS idx_ee_location   ON emergency_events USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_ee_session_id ON emergency_events (session_id);
CREATE INDEX IF NOT EXISTS idx_ee_event_type ON emergency_events (event_type);
CREATE INDEX IF NOT EXISTS idx_ee_created_at ON emergency_events (session_id, created_at ASC);

-- GIN index for JSONB data queries
CREATE INDEX IF NOT EXISTS idx_ee_data       ON emergency_events USING GIN (data);

COMMENT ON TABLE  emergency_events            IS 'Stream of events within an emergency session (location pings, contacts notified, calls made, etc.)';
COMMENT ON COLUMN emergency_events.event_type IS 'e.g. sos_activated, location_update, contact_notified, resolved';
COMMENT ON COLUMN emergency_events.data       IS 'Flexible payload; schema depends on event_type';
