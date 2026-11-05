-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Seed 003: Demo Community Posts, Reports & Nearby Facilities
-- Area: Uttam Nagar / Vikaspuri, New Delhi
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- COMMUNITY POSTS (3 posts by Priya Sharma)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_priya_id UUID;
BEGIN
  SELECT id INTO v_priya_id FROM users WHERE email = 'priya@abhaya.demo';

  IF v_priya_id IS NULL THEN
    RAISE WARNING 'Priya Sharma not found — run seed 001 first. Skipping community posts.';
    RETURN;
  END IF;

  -- Post 1: Street lighting alert
  INSERT INTO community_posts (
    user_id, title, content, location, area_name, category,
    is_anonymous, is_active, like_count
  ) VALUES (
    v_priya_id,
    'Street lights out on Nawada Lane — please fix ASAP!',
    'The entire stretch from Nawada bus stop to the housing complex entrance has had no working street lights for 3 nights now. It feels very unsafe walking back from the metro after 8 PM. PWD has been informed but no action yet. Ladies please avoid this route after dark until this is resolved.',
    ST_SetSRID(ST_MakePoint(77.0540, 28.6190), 4326),
    'Nawada, Uttam Nagar',
    'streetlight',
    FALSE, TRUE, 24
  )
  ON CONFLICT DO NOTHING;

  -- Post 2: Safety tip / positive experience
  INSERT INTO community_posts (
    user_id, title, content, location, area_name, category,
    is_anonymous, is_active, like_count
  ) VALUES (
    v_priya_id,
    'Janakpuri District Centre feels very safe — CCTV everywhere',
    'Just want to share that the District Centre area in Janakpuri has really improved. There are CCTV cameras at every corner, good lighting, and police patrols in the evening. Would recommend this route for anyone commuting late from Dwarka or Uttam Nagar. The new kiosks also have emergency call buttons!',
    ST_SetSRID(ST_MakePoint(77.0830, 28.6258), 4326),
    'Janakpuri District Centre',
    'other',
    FALSE, TRUE, 41
  )
  ON CONFLICT DO NOTHING;

  -- Post 3: Harassment report (anonymous)
  INSERT INTO community_posts (
    user_id, title, content, location, area_name, category,
    is_anonymous, is_active, like_count
  ) VALUES (
    v_priya_id,
    'Repeated harassment near Dwarka Mor underpass',
    'As a frequent commuter I want to warn everyone about the underpass near Dwarka Mor metro. A group of men have been making remarks and following women at night. The area has very poor lighting and no CCTV. Please walk in groups or use the main road instead. I have submitted a formal report to the police but nothing has changed in 2 weeks.',
    ST_SetSRID(ST_MakePoint(77.0405, 28.6160), 4326),
    'Dwarka Mor',
    'harassment',
    TRUE, TRUE, 87
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Community posts inserted for Priya Sharma (%).', v_priya_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- COMMUNITY REPORTS
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_priya_id UUID;
  v_admin_id UUID;
  v_admin_rec_id UUID;
  v_report1_id UUID;
  v_report2_id UUID;
BEGIN
  SELECT id INTO v_priya_id   FROM users       WHERE email    = 'priya@abhaya.demo';
  SELECT id INTO v_admin_id   FROM users       WHERE email    = 'admin@abhaya.demo';
  SELECT id INTO v_admin_rec_id FROM admin_users WHERE user_id = v_admin_id;

  IF v_priya_id IS NULL THEN
    RAISE WARNING 'Priya not found — skipping community reports.';
    RETURN;
  END IF;

  -- Report 1: Verified — broken streetlight
  INSERT INTO community_reports (
    id, user_id, category, location, address, description,
    image_urls, status, reported_at, verified_at, expires_at
  ) VALUES (
    '22222222-2222-2222-2222-222222222001',
    v_priya_id,
    'streetlight',
    ST_SetSRID(ST_MakePoint(77.0545, 28.6188), 4326),
    'Near Nawada Bus Stop, Uttam Nagar, New Delhi - 110059',
    'Three consecutive street lights are non-functional from the Nawada Bus Stop to Gate 4 of Nawada Housing Complex. Issue persists for 4 days. Photos attached.',
    ARRAY[
      'https://cdn.abhaya.app/reports/demo/nawada_light_1.jpg',
      'https://cdn.abhaya.app/reports/demo/nawada_light_2.jpg'
    ],
    'verified',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '23 days'
  )
  ON CONFLICT (id) DO NOTHING;

  v_report1_id := '22222222-2222-2222-2222-222222222001';

  -- Insert verification record for report 1 (only if admin exists and report was just created)
  IF v_admin_rec_id IS NOT NULL AND
     NOT EXISTS (SELECT 1 FROM report_verifications WHERE report_id = v_report1_id)
  THEN
    -- Temporarily bypass the trigger auto-update since status is already set above
    INSERT INTO report_verifications (report_id, verified_by, action, notes)
    VALUES (
      v_report1_id,
      v_admin_rec_id,
      'verify',
      'Confirmed via PWD outage database and on-site photo evidence. Forwarded to Delhi PWD maintenance cell.'
    );
  END IF;

  -- Report 2: Pending — isolation concern
  INSERT INTO community_reports (
    id, user_id, category, location, address, description,
    image_urls, status, reported_at, expires_at
  ) VALUES (
    '22222222-2222-2222-2222-222222222002',
    v_priya_id,
    'isolation',
    ST_SetSRID(ST_MakePoint(77.0410, 28.6158), 4326),
    'Dwarka Mor Underpass, Outer Ring Road, New Delhi - 110075',
    'The underpass under Outer Ring Road near Dwarka Mor metro is completely isolated after 9 PM. No foot traffic, no CCTV, and groups of men loitering. Multiple women have reported being followed here. Urgent intervention needed.',
    ARRAY[
      'https://cdn.abhaya.app/reports/demo/dwarka_mor_underpass.jpg'
    ],
    'pending',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '28 days'
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Community reports inserted.';
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- NEARBY FACILITIES (1 police station + 1 hospital)
-- ─────────────────────────────────────────────────────────────
INSERT INTO nearby_facilities (id, name, facility_type, location, address, phone, is_verified, google_place_id) VALUES

-- Uttam Nagar Police Station
(
  '33333333-3333-3333-3333-333333333001',
  'Uttam Nagar Police Station',
  'police',
  ST_SetSRID(ST_MakePoint(77.0570, 28.6220), 4326),
  'Uttam Nagar East, West Delhi, New Delhi - 110059',
  '011-25366666',
  TRUE,
  'ChIJUttamNagarPS2024'
),

-- Deen Dayal Upadhyay Hospital (DDU)
(
  '33333333-3333-3333-3333-333333333002',
  'Deen Dayal Upadhyay Hospital',
  'hospital',
  ST_SetSRID(ST_MakePoint(77.0695, 28.6305), 4326),
  'Hari Nagar, West Delhi, New Delhi - 110064',
  '011-25467676',
  TRUE,
  'ChIJDDUHospital2024Delhi'
),

-- Vikaspuri Metro Pharmacy
(
  '33333333-3333-3333-3333-333333333003',
  'Apollo Pharmacy — Vikaspuri',
  'pharmacy',
  ST_SetSRID(ST_MakePoint(77.0462, 28.6265), 4326),
  'B-3 Vikaspuri Market, New Delhi - 110018',
  '011-45678901',
  TRUE,
  'ChIJApolloPharmVikaspuri'
),

-- Uttam Nagar East Metro Station
(
  '33333333-3333-3333-3333-333333333004',
  'Uttam Nagar East Metro Station',
  'metro',
  ST_SetSRID(ST_MakePoint(77.0588, 28.6212), 4326),
  'Blue Line, Uttam Nagar East, West Delhi, New Delhi - 110059',
  '1800-200-2000',
  TRUE,
  'ChIJUttamNagarEastMetro'
)

ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ─── Verification queries ─────────────────────────────────────
SELECT title, area_name, like_count, is_anonymous
FROM   community_posts
ORDER  BY like_count DESC;

SELECT category, status, address
FROM   community_reports
ORDER  BY reported_at DESC;

SELECT name, facility_type, is_verified
FROM   nearby_facilities
ORDER  BY facility_type;
