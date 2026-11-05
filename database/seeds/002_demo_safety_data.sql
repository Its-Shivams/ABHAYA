-- ============================================================
-- ABHAYA Women's Safety & Smart Navigation Platform
-- Seed 002: Demo Road Segments & Safety Scores
-- Area: Uttam Nagar / Vikaspuri, New Delhi
-- Centre approx: 28.6212° N, 77.0588° E
-- ============================================================
-- Coordinate reference:
--   Uttam Nagar East Metro  ~ 28.6212, 77.0588
--   Uttam Nagar West Metro  ~ 28.6207, 77.0511
--   Vikaspuri               ~ 28.6260, 77.0450
--   Dwarka Mor              ~ 28.6163, 77.0398
--   Janakpuri West          ~ 28.6260, 77.0810
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- ROAD SEGMENTS (5 segments)
-- ─────────────────────────────────────────────────────────────
INSERT INTO road_segments (id, segment_name, geometry, city, district) VALUES

-- SEG-1: Uttam Nagar East Metro to Market (well-lit commercial strip)
(
  '11111111-1111-1111-1111-111111111001',
  'Uttam Nagar East Metro Road',
  ST_SetSRID(ST_MakeLine(
    ST_MakePoint(77.0588, 28.6212),
    ST_MakePoint(77.0620, 28.6218)
  ), 4326),
  'New Delhi', 'West Delhi'
),

-- SEG-2: Vikaspuri Main Road (moderate activity, mixed lighting)
(
  '11111111-1111-1111-1111-111111111002',
  'Vikaspuri Main Road',
  ST_SetSRID(ST_MakeLine(
    ST_MakePoint(77.0450, 28.6260),
    ST_MakePoint(77.0510, 28.6250)
  ), 4326),
  'New Delhi', 'West Delhi'
),

-- SEG-3: Nawada Housing Complex Internal Lane (poorly lit, isolated)
(
  '11111111-1111-1111-1111-111111111003',
  'Nawada Housing Complex Lane',
  ST_SetSRID(ST_MakeLine(
    ST_MakePoint(77.0540, 28.6190),
    ST_MakePoint(77.0558, 28.6175)
  ), 4326),
  'New Delhi', 'West Delhi'
),

-- SEG-4: Dwarka Mor Flyover Underpass (low visibility, high incident risk)
(
  '11111111-1111-1111-1111-111111111004',
  'Dwarka Mor Underpass',
  ST_SetSRID(ST_MakeLine(
    ST_MakePoint(77.0398, 28.6163),
    ST_MakePoint(77.0420, 28.6155)
  ), 4326),
  'New Delhi', 'West Delhi'
),

-- SEG-5: Janakpuri District Centre Road (high activity, CCTV covered)
(
  '11111111-1111-1111-1111-111111111005',
  'Janakpuri District Centre Road',
  ST_SetSRID(ST_MakeLine(
    ST_MakePoint(77.0810, 28.6260),
    ST_MakePoint(77.0850, 28.6255)
  ), 4326),
  'New Delhi', 'West Delhi'
)

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SAFETY INDICATORS
-- ─────────────────────────────────────────────────────────────
INSERT INTO safety_indicators (road_segment_id, indicator_type, score, data_source, confidence) VALUES

-- SEG-1: Uttam Nagar East Metro Road — Zone A
('11111111-1111-1111-1111-111111111001', 'streetlight',      88.0, 'Delhi PWD Survey 2024',       95.0),
('11111111-1111-1111-1111-111111111001', 'cctv',             85.0, 'Delhi Police CCTV Registry',  90.0),
('11111111-1111-1111-1111-111111111001', 'public_activity',  90.0, 'Google Popular Times API',    85.0),
('11111111-1111-1111-1111-111111111001', 'police_access',    82.0, 'OSM + Police Station Data',   88.0),
('11111111-1111-1111-1111-111111111001', 'hospital_access',  78.0, 'Ministry of Health Registry', 80.0),

-- SEG-2: Vikaspuri Main Road — Zone B
('11111111-1111-1111-1111-111111111002', 'streetlight',      72.0, 'Delhi PWD Survey 2024',       90.0),
('11111111-1111-1111-1111-111111111002', 'cctv',             60.0, 'Delhi Police CCTV Registry',  85.0),
('11111111-1111-1111-1111-111111111002', 'public_activity',  75.0, 'Google Popular Times API',    88.0),
('11111111-1111-1111-1111-111111111002', 'police_access',    68.0, 'OSM + Police Station Data',   80.0),
('11111111-1111-1111-1111-111111111002', 'hospital_access',  65.0, 'Ministry of Health Registry', 78.0),

-- SEG-3: Nawada Housing Complex Lane — Zone C
('11111111-1111-1111-1111-111111111003', 'streetlight',      42.0, 'Community Report Aggregate',  70.0),
('11111111-1111-1111-1111-111111111003', 'cctv',             30.0, 'Delhi Police CCTV Registry',  75.0),
('11111111-1111-1111-1111-111111111003', 'public_activity',  38.0, 'Google Popular Times API',    72.0),
('11111111-1111-1111-1111-111111111003', 'police_access',    50.0, 'OSM + Police Station Data',   78.0),
('11111111-1111-1111-1111-111111111003', 'hospital_access',  45.0, 'Ministry of Health Registry', 70.0),

-- SEG-4: Dwarka Mor Underpass — Zone D
('11111111-1111-1111-1111-111111111004', 'streetlight',      22.0, 'Community Report Aggregate',  65.0),
('11111111-1111-1111-1111-111111111004', 'cctv',             15.0, 'Delhi Police CCTV Registry',  60.0),
('11111111-1111-1111-1111-111111111004', 'public_activity',  18.0, 'Google Popular Times API',    68.0),
('11111111-1111-1111-1111-111111111004', 'police_access',    35.0, 'OSM + Police Station Data',   70.0),
('11111111-1111-1111-1111-111111111004', 'hospital_access',  40.0, 'Ministry of Health Registry', 65.0),

-- SEG-5: Janakpuri District Centre Road — Zone A
('11111111-1111-1111-1111-111111111005', 'streetlight',      92.0, 'Delhi PWD Survey 2024',       96.0),
('11111111-1111-1111-1111-111111111005', 'cctv',             95.0, 'Delhi Police CCTV Registry',  95.0),
('11111111-1111-1111-1111-111111111005', 'public_activity',  88.0, 'Google Popular Times API',    90.0),
('11111111-1111-1111-1111-111111111005', 'police_access',    90.0, 'OSM + Police Station Data',   92.0),
('11111111-1111-1111-1111-111111111005', 'hospital_access',  85.0, 'Ministry of Health Registry', 88.0)

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SAFETY SCORES (current snapshot — is_current = TRUE)
-- Zone mapping: A ≥ 80 | B 60–79 | C 40–59 | D < 40
-- ─────────────────────────────────────────────────────────────
INSERT INTO safety_scores (
    road_segment_id,
    overall_score, zone_class,
    incident_score, streetlight_score, public_score,
    cctv_score, police_score, hospital_score, community_score,
    calculated_at, is_current
) VALUES

-- SEG-1: Zone A
(
  '11111111-1111-1111-1111-111111111001',
  84.60, 'A',
  82.0, 88.0, 90.0, 85.0, 82.0, 78.0, 83.0,
  NOW() - INTERVAL '1 day', TRUE
),

-- SEG-2: Zone B
(
  '11111111-1111-1111-1111-111111111002',
  68.00, 'B',
  65.0, 72.0, 75.0, 60.0, 68.0, 65.0, 70.0,
  NOW() - INTERVAL '1 day', TRUE
),

-- SEG-3: Zone C
(
  '11111111-1111-1111-1111-111111111003',
  41.00, 'C',
  35.0, 42.0, 38.0, 30.0, 50.0, 45.0, 44.0,
  NOW() - INTERVAL '1 day', TRUE
),

-- SEG-4: Zone D
(
  '11111111-1111-1111-1111-111111111004',
  26.00, 'D',
  20.0, 22.0, 18.0, 15.0, 35.0, 40.0, 24.0,
  NOW() - INTERVAL '1 day', TRUE
),

-- SEG-5: Zone A
(
  '11111111-1111-1111-1111-111111111005',
  90.00, 'A',
  88.0, 92.0, 88.0, 95.0, 90.0, 85.0, 90.0,
  NOW() - INTERVAL '1 day', TRUE
)

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SAFETY HISTORY (sample historical transition for SEG-3)
-- ─────────────────────────────────────────────────────────────
INSERT INTO safety_history (road_segment_id, old_score, new_score, old_zone, new_zone, reason, changed_at)
VALUES (
  '11111111-1111-1111-1111-111111111003',
  54.50,       -- was Zone C, higher score
  41.00,       -- dropped after community incidents reported
  'C', 'C',
  'Score recalculated after 3 community harassment reports in 7-day window',
  NOW() - INTERVAL '1 day'
),
(
  '11111111-1111-1111-1111-111111111003',
  61.20,       -- previously in Zone B
  54.50,
  'B', 'C',
  'Streetlight outage confirmed by PWD; public activity decrease at night',
  NOW() - INTERVAL '15 days'
)

ON CONFLICT DO NOTHING;

COMMIT;

-- ─── Verification query ───────────────────────────────────────
SELECT
  rs.segment_name,
  ss.overall_score,
  ss.zone_class,
  ss.is_current,
  rs.city
FROM road_segments rs
JOIN safety_scores ss ON ss.road_segment_id = rs.id AND ss.is_current = TRUE
ORDER BY ss.overall_score DESC;
