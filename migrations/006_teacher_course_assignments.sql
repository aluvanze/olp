-- Teacher Course Assignments by Term
-- This table allows headteachers to assign teachers to courses for specific terms

CREATE TABLE IF NOT EXISTS teacher_course_assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    term_number INTEGER NOT NULL CHECK (term_number >= 1 AND term_number <= 3),
    academic_year VARCHAR(20) NOT NULL,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(course_id, teacher_id, term_number, academic_year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_term 
    ON teacher_course_assignments(term_number, academic_year);

CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_teacher 
    ON teacher_course_assignments(teacher_id, is_active);

CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_course 
    ON teacher_course_assignments(course_id, is_active);

