-- Grades System Migration
-- Adds support for multiple grades (Grade 10, Grade 11, etc.)
-- Note: Using "grade_levels" table name to avoid conflict with existing "grades" table (student grades)

-- Create grade_levels table
CREATE TABLE IF NOT EXISTS grade_levels (
    id SERIAL PRIMARY KEY,
    grade_number INTEGER NOT NULL UNIQUE, -- 10, 11, 12, etc.
    name VARCHAR(50) NOT NULL, -- "Grade 10", "Grade 11", etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grade_levels_grade_number ON grade_levels(grade_number);
CREATE INDEX IF NOT EXISTS idx_grade_levels_active ON grade_levels(is_active);

-- Add grade_id to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS grade_id INTEGER REFERENCES grade_levels(id) ON DELETE SET NULL;

-- Create index for grade_id in courses
CREATE INDEX IF NOT EXISTS idx_courses_grade_id ON courses(grade_id);

-- Insert default grades (Grade 10 and Grade 11)
INSERT INTO grade_levels (grade_number, name, description, is_active)
VALUES 
    (10, 'Grade 10', 'Grade 10 - Form 1 equivalent', true),
    (11, 'Grade 11', 'Grade 11 - Form 2 equivalent', true)
ON CONFLICT (grade_number) DO NOTHING;

-- Update existing courses to be associated with Grade 10 (if they exist)
-- This assumes existing courses are for Grade 10
UPDATE courses 
SET grade_id = (SELECT id FROM grade_levels WHERE grade_number = 10 LIMIT 1)
WHERE grade_id IS NULL;

