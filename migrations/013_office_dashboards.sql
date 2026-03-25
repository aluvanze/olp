-- Add office roles for administrative dashboards + school classification tagging

DO $$
BEGIN
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_county_office';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'county_office';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'national_office';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

CREATE TABLE IF NOT EXISTS school_tags (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  tag_type VARCHAR(50) NOT NULL, -- e.g. 'performance', 'infrastructure', 'pathway_focus'
  tag_value VARCHAR(100) NOT NULL, -- e.g. 'STEM Center of Excellence'
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, tag_type, tag_value)
);

