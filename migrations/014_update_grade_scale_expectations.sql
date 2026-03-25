-- Update grade scale to EE/ME/AE/BE scheme (idempotent upserts)

-- Keep table structure the same; repurpose letter_grade values to EE1..BE2 and gpa_points as "points".
-- Ranges are inclusive.

INSERT INTO grade_scale (letter_grade, min_percentage, max_percentage, gpa_points, description, is_active)
VALUES
  ('EE1', 90.0, 100.0, 8.0, 'Exceeding Expectations (EE1)', true),
  ('EE2', 75.0, 89.999, 7.0, 'Exceeding Expectations (EE2)', true),
  ('ME1', 58.0, 74.999, 6.0, 'Meeting Expectations (ME1)', true),
  ('ME2', 41.0, 57.999, 5.0, 'Meeting Expectations (ME2)', true),
  ('AE1', 31.0, 40.999, 4.0, 'Approaching Expectations (AE1)', true),
  ('AE2', 21.0, 30.999, 3.0, 'Approaching Expectations (AE2)', true),
  ('BE1', 11.0, 20.999, 2.0, 'Below Expectations (BE1)', true),
  ('BE2', 1.0, 10.999, 1.0, 'Below Expectations (BE2)', true),
  ('-',   0.0, 0.999,  0.0, 'No score / Not assessed', true)
ON CONFLICT (letter_grade)
DO UPDATE SET
  min_percentage = EXCLUDED.min_percentage,
  max_percentage = EXCLUDED.max_percentage,
  gpa_points = EXCLUDED.gpa_points,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Deactivate legacy letter grades if they exist
UPDATE grade_scale
SET is_active = false
WHERE letter_grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F')
  AND is_active = true;

