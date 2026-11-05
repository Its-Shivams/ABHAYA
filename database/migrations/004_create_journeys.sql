-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 004: Journeys & Live Location Tracking
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE journey_status AS ENUM ('planned', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: journeys ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journeys (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    start_location    GEOMETRY(Point, 4326) NOT NULL,
    end_location      GEOMETRY(Point, 4326),
    start_address     TEXT,
    end_address       TEXT,
    status            journey_status  NOT NULL DEFAULT 'planned',
    selected_route_id UUID,                        -- FK to future routes table
    sharing_enabled   BOOLEAN         NOT NULL DEFAULT FALSE,
    started_at        TIMESTAMPTZ,
    ended_at          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT j_ended_after_started CHECK (
        ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at
    )
);

-- Spatial indexes
CREATE INDEX IF NOT EXISTS idx_journeys_start_geom ON journeys USING GIST (start_location);
CREATE INDEX IF NOT EXISTS idx_journeys_end_geom   ON journeys USING GIST (end_location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_journeys_user_id    ON journeys (user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status     ON journeys (status);
CREATE INDEX IF NOT EXISTS idx_journeys_active     ON journeys (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_journeys_created_at ON journeys (created_at DESC);

COMMENT ON TABLE  journeys                 IS 'Recorded navigation journeys for primary users';
COMMENT ON COLUMN journeys.start_location  IS 'Origin point in WGS-84 (SRID 4326)';
COMMENT ON COLUMN journeys.end_location    IS 'Destination point in WGS-84 (SRID 4326); NULL if destination not set';
COMMENT ON COLUMN journeys.sharing_enabled IS 'Whether real-time location is shared with trusted contacts';
COMMENT ON COLUMN journeys.selected_route_id IS 'Reference to the chosen route (future routes table)';

-- ─── TABLE: live_locations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS live_locations (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id    UUID        NOT NULL REFERENCES journeys (id) ON DELETE CASCADE,
    user_id       UUID        NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
    location      GEOMETRY(Point, 4326) NOT NULL,
    accuracy      NUMERIC(8, 2),          -- metres
    speed         NUMERIC(8, 2),          -- m/s
    battery_level SMALLINT,               -- 0–100
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_current    BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT ll_battery_range  CHECK (battery_level IS NULL OR (battery_level BETWEEN 0 AND 100)),
    CONSTRAINT ll_accuracy_pos   CHECK (accuracy  IS NULL OR accuracy  >= 0),
    CONSTRAINT ll_speed_pos      CHECK (speed     IS NULL OR speed     >= 0)
);

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_ll_location   ON live_locations USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_ll_journey_id ON live_locations (journey_id);
CREATE INDEX IF NOT EXISTS idx_ll_user_id    ON live_locations (user_id);
CREATE INDEX IF NOT EXISTS idx_ll_timestamp  ON live_locations (journey_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ll_is_current ON live_locations (journey_id) WHERE is_current = TRUE;

COMMENT ON TABLE  live_locations             IS 'Time-series GPS breadcrumb trail for each active journey';
COMMENT ON COLUMN live_locations.is_current  IS 'Only the most-recent ping for a journey should be TRUE';
COMMENT ON COLUMN live_locations.accuracy    IS 'GPS fix accuracy in metres';

-- ─── TRIGGER: enforce single is_current per journey ──────────
CREATE OR REPLACE FUNCTION ll_clear_previous_current()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE live_locations
    SET    is_current = FALSE
    WHERE  journey_id = NEW.journey_id
      AND  id         <> NEW.id
      AND  is_current = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ll_current ON live_locations;
CREATE TRIGGER trg_ll_current
  AFTER INSERT OR UPDATE OF is_current ON live_locations
  FOR EACH ROW EXECUTE FUNCTION ll_clear_previous_current();

-- ─── TABLE: journey_contacts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_contacts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id      UUID        NOT NULL REFERENCES journeys (id) ON DELETE CASCADE,
    contact_user_id UUID        NOT NULL REFERENCES users    (id) ON DELETE CASCADE,
    notified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT jc_unique_pair UNIQUE (journey_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_jc_journey_id      ON journey_contacts (journey_id);
CREATE INDEX IF NOT EXISTS idx_jc_contact_user_id ON journey_contacts (contact_user_id);

COMMENT ON TABLE journey_contacts IS 'Trusted contacts who are notified/watching a specific journey';
