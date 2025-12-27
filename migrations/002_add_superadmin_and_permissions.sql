-- Add superadmin role and enhance permissions

-- Update user_role enum to include superadmin
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Add system overview/analytics table for headteacher/superadmin
CREATE TABLE IF NOT EXISTS system_analytics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value TEXT,
    metric_type VARCHAR(50), -- 'count', 'percentage', 'text', 'json'
    category VARCHAR(50), -- 'users', 'courses', 'grades', 'attendance'
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_name, calculated_at)
);

-- Add teacher allocation tracking
CREATE TABLE IF NOT EXISTS teacher_allocations (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    allocated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    allocation_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, course_id)
);

-- Add enrollment authorization tracking
ALTER TABLE course_enrollments 
ADD COLUMN IF NOT EXISTS authorized_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS authorization_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
ADD COLUMN IF NOT EXISTS authorization_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS authorization_notes TEXT;

-- Update existing enrollments to approved if they exist
UPDATE course_enrollments 
SET authorization_status = 'approved', 
    authorized_by = (SELECT teacher_id FROM courses WHERE courses.id = course_enrollments.course_id)
WHERE authorization_status IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_allocations_teacher ON teacher_allocations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_allocations_course ON teacher_allocations(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_authorization ON course_enrollments(authorization_status);

