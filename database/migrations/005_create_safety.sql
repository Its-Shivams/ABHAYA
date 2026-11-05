-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 005: Road Segments, Safety Indicators & Scores
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE indicator_type AS ENUM (
    'streetlight', 'cctv', 'public_activity', 'police_access', 'hospital_access'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE zone_class AS ENUM ('A', 'B', 'C', 'D');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: road_segments ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS road_segments (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_name  VARCHAR(255) NOT NULL,
    geometry      GEOMETRY(LineString, 4326) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    district      VARCHAR(100),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Spatial index on road geometry
CREATE INDEX IF NOT EXISTS idx_rs_geometry    ON road_segments USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_rs_city        ON road_segments (city);
CREATE INDEX IF NOT EXISTS idx_rs_district    ON road_segments (district);
CREATE INDEX IF NOT EXISTS idx_rs_segment_name ON road_segments (segment_name);

COMMENT ON TABLE  road_segments          IS 'Discrete navigable road segments used for safety scoring';
COMMENT ON COLUMN road_segments.geometry IS 'LineString geometry of the road segment in WGS-84 (SRID 4326)';

-- ─── TABLE: safety_indicators ─────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_indicators (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    road_segment_id  UUID            NOT NULL REFERENCES road_segments (id) ON DELETE CASCADE,
    indicator_type   indicator_type  NOT NULL,
    score            NUMERIC(5, 2)   NOT NULL,
    data_source      VARCHAR(150),
    confidence       NUMERIC(5, 2)   NOT NULL DEFAULT 100.0,
    recorded_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT si_score_range      CHECK (score      BETWEEN 0 AND 100),
    CONSTRAINT si_confidence_range CHECK (confidence BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_si_road_segment_id ON safety_indicators (road_segment_id);
CREATE INDEX IF NOT EXISTS idx_si_indicator_type  ON safety_indicators (indicator_type);
CREATE INDEX IF NOT EXISTS idx_si_recorded_at     ON safety_indicators (road_segment_id, recorded_at DESC);

COMMENT ON TABLE  safety_indicators                 IS 'Individual factor scores that feed into the aggregate safety score';
COMMENT ON COLUMN safety_indicators.score           IS 'Score 0–100; higher = safer';
COMMENT ON COLUMN safety_indicators.confidence      IS 'Confidence in data source accuracy, 0–100';

-- ─── TABLE: safety_scores ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_scores (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    road_segment_id   UUID            NOT NULL REFERENCES road_segments (id) ON DELETE CASCADE,
    overall_score     NUMERIC(5, 2)   NOT NULL,
    zone_class        CHAR(1)         NOT NULL,
    incident_score    NUMERIC(5, 2),
    streetlight_score NUMERIC(5, 2),
    public_score      NUMERIC(5, 2),
    cctv_score        NUMERIC(5, 2),
    police_score      NUMERIC(5, 2),
    hospital_score    NUMERIC(5, 2),
    community_score   NUMERIC(5, 2),
    calculated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    is_current        BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT ss_overall_range      CHECK (overall_score   BETWEEN 0 AND 100),
    CONSTRAINT ss_zone_class_valid   CHECK (zone_class      IN ('A', 'B', 'C', 'D')),
    CONSTRAINT ss_incident_range     CHECK (incident_score  IS NULL OR incident_score     BETWEEN 0 AND 100),
    CONSTRAINT ss_streetlight_range  CHECK (streetlight_score IS NULL OR streetlight_score BETWEEN 0 AND 100),
    CONSTRAINT ss_public_range       CHECK (public_score    IS NULL OR public_score       BETWEEN 0 AND 100),
    CONSTRAINT ss_cctv_range         CHECK (cctv_score      IS NULL OR cctv_score         BETWEEN 0 AND 100),
    CONSTRAINT ss_police_range       CHECK (police_score    IS NULL OR police_score       BETWEEN 0 AND 100),
    CONSTRAINT ss_hospital_range     CHECK (hospital_score  IS NULL OR hospital_score     BETWEEN 0 AND 100),
    CONSTRAINT ss_community_range    CHECK (community_score IS NULL OR community_score    BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_ss_road_segment_id ON safety_scores (road_segment_id);
CREATE INDEX IF NOT EXISTS idx_ss_is_current       ON safety_scores (road_segment_id) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_ss_zone_class       ON safety_scores (zone_class);
CREATE INDEX IF NOT EXISTS idx_ss_overall_score    ON safety_scores (overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_ss_calculated_at    ON safety_scores (road_segment_id, calculated_at DESC);

COMMENT ON TABLE  safety_scores                 IS 'Aggregated safety score per road segment; only one row per segment should have is_current=TRUE';
COMMENT ON COLUMN safety_scores.zone_class      IS 'Safety zone: A=Safest, B=Safe, C=Moderate, D=Unsafe';
COMMENT ON COLUMN safety_scores.overall_score   IS 'Weighted aggregate score 0–100';

-- ─── TRIGGER: enforce single is_current per road segment ──────
CREATE OR REPLACE FUNCTION ss_clear_previous_current()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE safety_scores
    SET    is_current = FALSE
    WHERE  road_segment_id = NEW.road_segment_id
      AND  id              <> NEW.id
      AND  is_current      = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ss_current ON safety_scores;
CREATE TRIGGER trg_ss_current
  AFTER INSERT OR UPDATE OF is_current ON safety_scores
  FOR EACH ROW EXECUTE FUNCTION ss_clear_previous_current();

-- ─── TABLE: safety_history ────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_history (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    road_segment_id  UUID        NOT NULL REFERENCES road_segments (id) ON DELETE CASCADE,
    old_score        NUMERIC(5, 2),
    new_score        NUMERIC(5, 2) NOT NULL,
    old_zone         CHAR(1),
    new_zone         CHAR(1)     NOT NULL,
    reason           TEXT,
    changed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sh_old_zone_valid CHECK (old_zone IS NULL OR old_zone IN ('A', 'B', 'C', 'D')),
    CONSTRAINT sh_new_zone_valid CHECK (new_zone IN ('A', 'B', 'C', 'D'))
);

CREATE INDEX IF NOT EXISTS idx_sh_road_segment_id ON safety_history (road_segment_id);
CREATE INDEX IF NOT EXISTS idx_sh_changed_at      ON safety_history (road_segment_id, changed_at DESC);

COMMENT ON TABLE safety_history IS 'Audit log of all changes to road segment safety scores over time';

-- ─── TRIGGER: auto-write safety_history on score change ───────
CREATE OR REPLACE FUNCTION ss_write_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.overall_score <> NEW.overall_score OR OLD.zone_class <> NEW.zone_class) THEN
    INSERT INTO safety_history (road_segment_id, old_score, new_score, old_zone, new_zone, reason)
    VALUES (NEW.road_segment_id, OLD.overall_score, NEW.overall_score, OLD.zone_class, NEW.zone_class, 'Score recalculated');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ss_history ON safety_scores;
CREATE TRIGGER trg_ss_history
  AFTER UPDATE ON safety_scores
  FOR EACH ROW EXECUTE FUNCTION ss_write_history();

-- ─── TRIGGER: auto-update updated_at on road_segments ─────────
DROP TRIGGER IF EXISTS trg_rs_updated_at ON road_segments;
CREATE TRIGGER trg_rs_updated_at
  BEFORE UPDATE ON road_segments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
