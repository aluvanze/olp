-- Add guardian phone numbers and grade to learner_profiles for headteacher Add Student flow
-- School ID = admission_number (primary identifier; DB id is internal only)

-- Add guardian contact fields (two phone numbers for parent/guardian)
ALTER TABLE learner_profiles
ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS guardian_phone_2 VARCHAR(30);

-- Add grade level (Grade 10, 11, etc.)
ALTER TABLE learner_profiles
ADD COLUMN IF NOT EXISTS grade_level_id INTEGER REFERENCES grade_levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_learner_profiles_grade_level ON learner_profiles(grade_level_id);
