-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Seed 004: Demo Journey for Priya Sharma
-- Route: Uttam Nagar East Metro → Nawada Housing Complex
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_priya_id    UUID;
  v_rahul_id    UUID;
  v_journey_id  UUID := '44444444-4444-4444-4444-444444444001';
BEGIN
  SELECT id INTO v_priya_id FROM users WHERE email = 'priya@abhaya.demo';
  SELECT id INTO v_rahul_id FROM users WHERE email = 'rahul@abhaya.demo';

  IF v_priya_id IS NULL THEN
    RAISE WARNING 'Priya Sharma not found — run seed 001 first. Skipping journey seed.';
    RETURN;
  END IF;

  -- ─── INSERT JOURNEY ───────────────────────────────────────
  INSERT INTO journeys (
    id,
    user_id,
    start_location,
    end_location,
    start_address,
    end_address,
    status,
    sharing_enabled,
    started_at,
    ended_at,
    created_at
  ) VALUES (
    v_journey_id,
    v_priya_id,
    -- Start: Uttam Nagar East Metro Station
    ST_SetSRID(ST_MakePoint(77.0588, 28.6212), 4326),
    -- End: Nawada Housing Complex Gate 4
    ST_SetSRID(ST_MakePoint(77.0558, 28.6175), 4326),
    'Uttam Nagar East Metro Station, West Delhi, New Delhi - 110059',
    'Nawada Housing Complex, Gate 4, Uttam Nagar, New Delhi - 110059',
    'completed',
    TRUE,                               -- was sharing with Rahul
    NOW() - INTERVAL '2 days' - INTERVAL '22 minutes',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' - INTERVAL '23 minutes'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ─── LIVE LOCATION PINGS (3 breadcrumb points) ────────────
  -- Ping 1: At metro exit (start of walk)
  INSERT INTO live_locations (
    journey_id, user_id, location,
    accuracy, speed, battery_level,
    timestamp, is_current
  ) VALUES (
    v_journey_id, v_priya_id,
    ST_SetSRID(ST_MakePoint(77.0588, 28.6212), 4326),
    5.0,    -- metres accuracy
    1.2,    -- m/s walking speed
    78,     -- battery %
    NOW() - INTERVAL '2 days' - INTERVAL '22 minutes',
    FALSE   -- not current (journey completed)
  )
  ON CONFLICT DO NOTHING;

  -- Ping 2: Midpoint on Nawada Lane
  INSERT INTO live_locations (
    journey_id, user_id, location,
    accuracy, speed, battery_level,
    timestamp, is_current
  ) VALUES (
    v_journey_id, v_priya_id,
    ST_SetSRID(ST_MakePoint(77.0570, 28.6195), 4326),
    6.5,
    1.0,
    76,
    NOW() - INTERVAL '2 days' - INTERVAL '12 minutes',
    FALSE
  )
  ON CONFLICT DO NOTHING;

  -- Ping 3: Arrived at destination (final ping)
  INSERT INTO live_locations (
    journey_id, user_id, location,
    accuracy, speed, battery_level,
    timestamp, is_current
  ) VALUES (
    v_journey_id, v_priya_id,
    ST_SetSRID(ST_MakePoint(77.0558, 28.6175), 4326),
    4.5,
    0.0,    -- stopped
    75,
    NOW() - INTERVAL '2 days',
    FALSE   -- journey is completed, no "current" ping needed
  )
  ON CONFLICT DO NOTHING;

  -- ─── JOURNEY CONTACTS (Rahul was watching) ────────────────
  IF v_rahul_id IS NOT NULL THEN
    INSERT INTO journey_contacts (journey_id, contact_user_id, notified_at)
    VALUES (
      v_journey_id,
      v_rahul_id,
      NOW() - INTERVAL '2 days' - INTERVAL '22 minutes'
    )
    ON CONFLICT (journey_id, contact_user_id) DO NOTHING;
  END IF;

  -- ─── NOTIFICATION to Rahul: journey started ───────────────
  IF v_rahul_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, data, is_read, fcm_sent)
    VALUES (
      v_rahul_id,
      'Priya started a journey',
      'Priya Sharma started a journey from Uttam Nagar East Metro to Nawada Housing Complex. Tap to follow.',
      'journey_started',
      jsonb_build_object(
        'journey_id',      v_journey_id,
        'user_id',         v_priya_id,
        'user_name',       'Priya Sharma',
        'start_address',   'Uttam Nagar East Metro',
        'end_address',     'Nawada Housing Complex'
      ),
      TRUE,   -- already read (historical)
      TRUE    -- already FCM-sent
    )
    ON CONFLICT DO NOTHING;

    -- NOTIFICATION to Rahul: journey completed
    INSERT INTO notifications (user_id, title, body, type, data, is_read, fcm_sent)
    VALUES (
      v_rahul_id,
      'Priya arrived safely',
      'Priya Sharma has arrived at Nawada Housing Complex. Journey completed.',
      'journey_completed',
      jsonb_build_object(
        'journey_id',    v_journey_id,
        'user_id',       v_priya_id,
        'user_name',     'Priya Sharma',
        'end_address',   'Nawada Housing Complex'
      ),
      TRUE,
      TRUE
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Demo journey % inserted for Priya Sharma with 3 location pings.', v_journey_id;
END;
$$;

COMMIT;

-- ─── Verification query ───────────────────────────────────────
SELECT
  j.id,
  j.status,
  j.start_address,
  j.end_address,
  j.started_at,
  j.ended_at,
  COUNT(ll.id)   AS location_pings,
  COUNT(jc.id)   AS watching_contacts
FROM  journeys        j
LEFT  JOIN live_locations ll ON ll.journey_id = j.id
LEFT  JOIN journey_contacts jc ON jc.journey_id = j.id
WHERE j.id = '44444444-4444-4444-4444-444444444001'
GROUP BY j.id, j.status, j.start_address, j.end_address, j.started_at, j.ended_at;
