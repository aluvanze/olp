-- Grade 10 LMS Database Schema

-- User roles enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'headteacher', 'deputy_headteacher', 'finance', 'parent');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    profile_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents relationship (link parents to students)
CREATE TABLE parent_student_relationships (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, student_id)
);

-- Courses/Subjects
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20),
    credits INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollments
CREATE TABLE course_enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Learning modules (customizable by teachers)
CREATE TABLE learning_modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    module_name VARCHAR(200) NOT NULL,
    module_description TEXT,
    module_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Module content/documents
CREATE TABLE module_content (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES learning_modules(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'document', 'video', 'link', 'text'
    title VARCHAR(200) NOT NULL,
    content_url VARCHAR(500),
    content_text TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES learning_modules(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50) DEFAULT 'homework', -- 'homework', 'quiz', 'project', 'exam'
    total_points DECIMAL(10, 2) NOT NULL,
    due_date TIMESTAMP,
    allow_late_submission BOOLEAN DEFAULT true,
    late_penalty_percent DECIMAL(5, 2) DEFAULT 0,
    instructions TEXT,
    attachments JSONB, -- Store file paths/info
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignment submissions
CREATE TABLE assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    submission_files JSONB, -- Store file paths/info
    submitted_at TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'graded', 'returned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- Attendance records
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
    notes TEXT,
    marked_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id, attendance_date)
);

-- Grades
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
    grade_type VARCHAR(50) NOT NULL, -- 'assignment', 'quiz', 'exam', 'participation', 'final'
    points_earned DECIMAL(10, 2) NOT NULL,
    points_possible DECIMAL(10, 2) NOT NULL,
    percentage DECIMAL(5, 2),
    letter_grade VARCHAR(5), -- 'A', 'B', 'C', 'D', 'F'
    comments TEXT,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Final course grades (computed)
CREATE TABLE final_grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    final_percentage DECIMAL(5, 2) NOT NULL,
    letter_grade VARCHAR(5) NOT NULL,
    gpa_points DECIMAL(3, 2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Messages/Email system
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_important BOOLEAN DEFAULT false,
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message attachments (for file storage reference)
CREATE TABLE message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings (for customization)
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grade scale configuration (customizable)
CREATE TABLE grade_scale (
    id SERIAL PRIMARY KEY,
    letter_grade VARCHAR(5) UNIQUE NOT NULL,
    min_percentage DECIMAL(5, 2) NOT NULL,
    max_percentage DECIMAL(5, 2) NOT NULL,
    gpa_points DECIMAL(3, 2) NOT NULL,
    description VARCHAR(100),
    is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_attendance_course_date ON attendance(course_id, attendance_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_grades_student_course ON grades(student_id, course_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Insert default grade scale
INSERT INTO grade_scale (letter_grade, min_percentage, max_percentage, gpa_points, description) VALUES
('A+', 97.0, 100.0, 4.0, 'Excellent'),
('A', 93.0, 96.9, 4.0, 'Excellent'),
('A-', 90.0, 92.9, 3.7, 'Good'),
('B+', 87.0, 89.9, 3.3, 'Good'),
('B', 83.0, 86.9, 3.0, 'Good'),
('B-', 80.0, 82.9, 2.7, 'Satisfactory'),
('C+', 77.0, 79.9, 2.3, 'Satisfactory'),
('C', 73.0, 76.9, 2.0, 'Satisfactory'),
('C-', 70.0, 72.9, 1.7, 'Below Average'),
('D+', 67.0, 69.9, 1.3, 'Below Average'),
('D', 63.0, 66.9, 1.0, 'Below Average'),
('D-', 60.0, 62.9, 0.7, 'Passing'),
('F', 0.0, 59.9, 0.0, 'Failing');

