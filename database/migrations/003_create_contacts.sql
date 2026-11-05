-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 003: Trusted Contacts & Connection Requests
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE contact_status AS ENUM ('pending', 'accepted', 'rejected', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: trusted_contacts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS trusted_contacts (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    contact_user_id  UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status           contact_status  NOT NULL DEFAULT 'pending',
    invited_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    accepted_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- A user cannot add themselves as a trusted contact
    CONSTRAINT tc_no_self_contact CHECK (user_id <> contact_user_id),
    -- Prevent duplicate pairs in the same direction
    CONSTRAINT tc_unique_pair UNIQUE (user_id, contact_user_id)
);

-- Indexes on trusted_contacts
CREATE INDEX IF NOT EXISTS idx_tc_user_id         ON trusted_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_tc_contact_user_id ON trusted_contacts (contact_user_id);
CREATE INDEX IF NOT EXISTS idx_tc_status          ON trusted_contacts (status);
CREATE INDEX IF NOT EXISTS idx_tc_accepted        ON trusted_contacts (user_id, contact_user_id)
    WHERE status = 'accepted';

COMMENT ON TABLE  trusted_contacts                IS 'Bidirectional trusted contact relationships between users';
COMMENT ON COLUMN trusted_contacts.user_id        IS 'The primary user who initiated/owns the contact';
COMMENT ON COLUMN trusted_contacts.contact_user_id IS 'The user being trusted (may or may not be a registered user)';
COMMENT ON COLUMN trusted_contacts.accepted_at    IS 'Timestamp when contact accepted the invitation';

-- ─── TABLE: connection_requests ──────────────────────────────
CREATE TABLE IF NOT EXISTS connection_requests (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    requested_id UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message      TEXT,
    status       request_status  NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- A user cannot request themselves
    CONSTRAINT cr_no_self_request CHECK (requester_id <> requested_id),
    -- Prevent duplicate active requests in the same direction
    CONSTRAINT cr_unique_active_pair UNIQUE (requester_id, requested_id)
);

-- Indexes on connection_requests
CREATE INDEX IF NOT EXISTS idx_cr_requester_id ON connection_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_cr_requested_id ON connection_requests (requested_id);
CREATE INDEX IF NOT EXISTS idx_cr_status       ON connection_requests (status);
CREATE INDEX IF NOT EXISTS idx_cr_pending      ON connection_requests (requested_id)
    WHERE status = 'pending';

COMMENT ON TABLE  connection_requests              IS 'Outbound connection/invite requests between platform users';
COMMENT ON COLUMN connection_requests.message      IS 'Optional personal message accompanying the request';

-- ─── TRIGGER: auto-update updated_at ─────────────────────────
DROP TRIGGER IF EXISTS trg_tc_updated_at ON trusted_contacts;
CREATE TRIGGER trg_tc_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── TRIGGER: set accepted_at automatically ──────────────────
CREATE OR REPLACE FUNCTION tc_set_accepted_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    NEW.accepted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tc_accepted_at ON trusted_contacts;
CREATE TRIGGER trg_tc_accepted_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION tc_set_accepted_at();
