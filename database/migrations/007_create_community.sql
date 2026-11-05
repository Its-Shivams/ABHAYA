-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 007: Community Reports, Verifications, Posts & Comments
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE report_category AS ENUM (
    'harassment', 'streetlight', 'cctv', 'isolation',
    'road_closure', 'infrastructure', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'pending', 'under_verification', 'verified', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_action AS ENUM ('verify', 'reject');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: community_reports ─────────────────────────────────
CREATE TABLE IF NOT EXISTS community_reports (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    category     report_category NOT NULL,
    location     GEOMETRY(Point, 4326) NOT NULL,
    address      TEXT,
    description  TEXT            NOT NULL,
    image_urls   TEXT[]          NOT NULL DEFAULT '{}',
    status       report_status   NOT NULL DEFAULT 'pending',
    reported_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    verified_at  TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT cr_verified_at_requires_status CHECK (
        verified_at IS NULL OR status IN ('verified', 'rejected')
    ),
    CONSTRAINT cr_expires_after_reported CHECK (expires_at > reported_at)
);

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_cr_location    ON community_reports USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_cr_user_id     ON community_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_cr_category    ON community_reports (category);
CREATE INDEX IF NOT EXISTS idx_cr_status      ON community_reports (status);
CREATE INDEX IF NOT EXISTS idx_cr_reported_at ON community_reports (reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_expires_at  ON community_reports (expires_at) WHERE status = 'pending';

-- GIN index for image_urls array queries
CREATE INDEX IF NOT EXISTS idx_cr_image_urls  ON community_reports USING GIN (image_urls);

COMMENT ON TABLE  community_reports            IS 'Crowd-sourced safety reports submitted by users';
COMMENT ON COLUMN community_reports.image_urls IS 'Array of image URLs (CDN/storage paths)';
COMMENT ON COLUMN community_reports.expires_at IS 'Defaults to 30 days; expiry auto-sets status to expired via scheduled job';

-- ─── TABLE: report_verifications ──────────────────────────────
CREATE TABLE IF NOT EXISTS report_verifications (
    id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id    UUID                NOT NULL REFERENCES community_reports (id) ON DELETE CASCADE,
    verified_by  UUID                NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT,
    action       verification_action NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rv_report_id   ON report_verifications (report_id);
CREATE INDEX IF NOT EXISTS idx_rv_verified_by ON report_verifications (verified_by);
CREATE INDEX IF NOT EXISTS idx_rv_created_at  ON report_verifications (created_at DESC);

COMMENT ON TABLE report_verifications IS 'Audit log of admin verification actions on community reports';

-- ─── TRIGGER: sync report status when verification is inserted ─
CREATE OR REPLACE FUNCTION rv_sync_report_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.action = 'verify' THEN
    UPDATE community_reports
    SET    status      = 'verified',
           verified_at = NOW()
    WHERE  id          = NEW.report_id;
  ELSIF NEW.action = 'reject' THEN
    UPDATE community_reports
    SET    status      = 'rejected',
           verified_at = NOW()
    WHERE  id          = NEW.report_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rv_sync_status ON report_verifications;
CREATE TRIGGER trg_rv_sync_status
  AFTER INSERT ON report_verifications
  FOR EACH ROW EXECUTE FUNCTION rv_sync_report_status();

-- ─── TABLE: community_posts ───────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    content      TEXT        NOT NULL,
    location     GEOMETRY(Point, 4326),
    area_name    VARCHAR(150),
    category     VARCHAR(100),
    is_anonymous BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    like_count   INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cp_like_count_non_neg CHECK (like_count >= 0)
);

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_cp_location    ON community_posts USING GIST (location);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_cp_user_id     ON community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_cp_is_active   ON community_posts (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cp_category    ON community_posts (category);
CREATE INDEX IF NOT EXISTS idx_cp_created_at  ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cp_area_name   ON community_posts (area_name);

COMMENT ON TABLE  community_posts              IS 'Community discussion posts about local safety issues';
COMMENT ON COLUMN community_posts.is_anonymous IS 'If TRUE, user identity is hidden in public responses';

-- ─── TABLE: community_comments ────────────────────────────────
CREATE TABLE IF NOT EXISTS community_comments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID        NOT NULL REFERENCES community_posts (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users          (id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_post_id    ON community_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_cc_user_id    ON community_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_cc_is_active  ON community_comments (post_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cc_created_at ON community_comments (post_id, created_at ASC);

COMMENT ON TABLE community_comments IS 'Threaded comments on community discussion posts';

-- ─── TRIGGER: auto-update updated_at on community_posts ───────
DROP TRIGGER IF EXISTS trg_cp_updated_at ON community_posts;
CREATE TRIGGER trg_cp_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
