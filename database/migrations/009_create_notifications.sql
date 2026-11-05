-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Migration 009: Notifications
-- ============================================================

-- ─── TABLE: notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    body       TEXT        NOT NULL,
    type       VARCHAR(100) NOT NULL,
    data       JSONB       NOT NULL DEFAULT '{}',
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    fcm_sent   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_notif_user_id    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read    ON notifications (user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_type       ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_fcm_sent   ON notifications (fcm_sent) WHERE fcm_sent = FALSE;

-- GIN index for data payload queries
CREATE INDEX IF NOT EXISTS idx_notif_data       ON notifications USING GIN (data);

COMMENT ON TABLE  notifications           IS 'In-app and push notification records for all user events';
COMMENT ON COLUMN notifications.type      IS 'Notification type key: journey_started, sos_activated, contact_accepted, etc.';
COMMENT ON COLUMN notifications.data      IS 'Flexible payload matching the notification type';
COMMENT ON COLUMN notifications.fcm_sent  IS 'Whether the Firebase Cloud Messaging push has been dispatched';
