-- OLP-Monitor Schema Updates for CBC Senior School (Grades 10-12)
-- Based on Kenya Competency-Based Curriculum requirements

-- Add School entity
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    county VARCHAR(100),
    sub_county VARCHAR(100),
    address TEXT,
    headteacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Pathway entity (STEM, Arts, Social Sciences)
CREATE TABLE IF NOT EXISTS pathways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Learning Areas (Core and Elective subjects)
CREATE TABLE IF NOT EXISTS learning_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    pathway_id INTEGER REFERENCES pathways(id) ON DELETE SET NULL, -- NULL for core subjects
    is_core BOOLEAN DEFAULT false,
    description TEXT,
    strands JSONB, -- Array of strands with sub-strands and indicators
    rubrics JSONB, -- Rubric definitions for levels 1-4
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, pathway_id)
);

-- Update users table to add TSC number and verification
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tsc_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

-- Update courses to link to learning areas
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE SET NULL;

-- Update users to link to school
ALTER TABLE users
ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;

-- Add Learner profile table
CREATE TABLE IF NOT EXISTS learner_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) UNIQUE,
    pathway_id INTEGER REFERENCES pathways(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kjsea_results JSONB, -- Kenya Junior School Education Assessment results
    registration_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learner Learning Area assignments (validates 4 core + 3 electives)
CREATE TABLE IF NOT EXISTS learner_learning_areas (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE CASCADE,
    is_core BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(learner_id, learning_area_id)
);

-- Formative Assessment with rubric levels
CREATE TABLE IF NOT EXISTS formative_assessments (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE CASCADE,
    strand_code VARCHAR(50),
    sub_strand_code VARCHAR(50),
    indicator_code VARCHAR(50),
    rubric_level INTEGER CHECK (rubric_level >= 1 AND rubric_level <= 4),
    score DECIMAL(5, 2), -- Auto-calculated from rubric level
    term INTEGER CHECK (term >= 1 AND term <= 3),
    academic_year VARCHAR(20) NOT NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Summative Assessments (Examinations)
CREATE TABLE IF NOT EXISTS summative_assessments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Opener', 'Mid', 'End'
    term INTEGER CHECK (term >= 1 AND term <= 3),
    academic_year VARCHAR(20) NOT NULL,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE CASCADE,
    total_marks DECIMAL(10, 2) DEFAULT 100,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Summative Assessment Results
CREATE TABLE IF NOT EXISTS summative_results (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES summative_assessments(id) ON DELETE CASCADE,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    score DECIMAL(10, 2) NOT NULL,
    percentage DECIMAL(5, 2), -- Auto-calculated
    grade VARCHAR(5), -- Auto-assigned based on percentage
    entered_by INTEGER REFERENCES users(id),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, learner_id)
);

-- Result Slips (Synthesized at end of term)
CREATE TABLE IF NOT EXISTS result_slips (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    term INTEGER CHECK (term >= 1 AND term <= 3),
    academic_year VARCHAR(20) NOT NULL,
    synthesized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synthesized_by INTEGER REFERENCES users(id),
    UNIQUE(learner_id, term, academic_year)
);

-- Result Slip Details (per learning area)
CREATE TABLE IF NOT EXISTS result_slip_details (
    id SERIAL PRIMARY KEY,
    result_slip_id INTEGER REFERENCES result_slips(id) ON DELETE CASCADE,
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE CASCADE,
    average_formative_score DECIMAL(5, 2),
    summative_score DECIMAL(5, 2),
    final_score DECIMAL(5, 2), -- Calculated from formative and summative
    final_grade VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(result_slip_id, learning_area_id)
);

-- Bursary Applications
CREATE TABLE IF NOT EXISTS bursary_applications (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount_requested DECIMAL(10, 2) NOT NULL,
    outstanding_balance DECIMAL(10, 2), -- Added by Finance Admin
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected', 'submitted'
    supporting_docs JSONB, -- Array of document URLs
    finance_review_notes TEXT,
    headteacher_notes TEXT,
    sponsor_submission_date TIMESTAMP,
    submitted_to_sponsor BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books Inventory
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    isbn VARCHAR(50),
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE SET NULL,
    total_copies INTEGER DEFAULT 0,
    available_copies INTEGER DEFAULT 0,
    publisher VARCHAR(200),
    edition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Issuance
CREATE TABLE IF NOT EXISTS book_issuances (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    issued_by INTEGER REFERENCES users(id),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'issued', -- 'issued', 'returned', 'lost', 'damaged'
    condition_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Transactions
-- Note: If financial_transactions exists, it will be kept, otherwise create new one
CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'fee_payment', 'bursary', 'refund'
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'mpesa', 'bank', 'cash', 'cheque'
    mpesa_confirmation_code VARCHAR(50) UNIQUE,
    reference_number VARCHAR(100),
    transaction_date DATE DEFAULT CURRENT_DATE,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Infrastructure Projects
CREATE TABLE IF NOT EXISTS infrastructure_projects (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    budget DECIMAL(15, 2),
    expenditure DECIMAL(15, 2) DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'on_hold'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Ratings (by students/parents)
CREATE TABLE IF NOT EXISTS teacher_ratings (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50), -- 'student', 'parent'
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, rated_by_user_id)
);

-- Curriculum Progress Tracking
CREATE TABLE IF NOT EXISTS curriculum_progress (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE CASCADE,
    strand_code VARCHAR(50),
    sub_strand_code VARCHAR(50),
    last_updated_rubric_level INTEGER,
    progress_percentage DECIMAL(5, 2), -- Calculated based on sub-strands covered
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, learning_area_id, strand_code, sub_strand_code)
);

-- Transfer Management
CREATE TABLE IF NOT EXISTS learner_transfers (
    id SERIAL PRIMARY KEY,
    learner_id INTEGER REFERENCES learner_profiles(id) ON DELETE CASCADE,
    from_school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    to_school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    transfer_reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_date DATE,
    transfer_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pathways
INSERT INTO pathways (name, code, description) VALUES
('STEM', 'STEM', 'Science, Technology, Engineering, and Mathematics Pathway'),
('Arts', 'ARTS', 'Arts and Sports Science Pathway'),
('Social Sciences', 'SOC', 'Social Sciences Pathway')
ON CONFLICT (code) DO NOTHING;

-- Insert default core learning areas (Grade 10-12 core subjects)
-- These are typically: English, Kiswahili, Mathematics, and one more core subject
INSERT INTO learning_areas (name, code, is_core, description) VALUES
('English', 'ENG', true, 'Core English Language'),
('Kiswahili', 'KIS', true, 'Core Kiswahili Language'),
('Mathematics', 'MATH', true, 'Core Mathematics'),
('Christian Religious Education', 'CRE', true, 'Core Religious Education')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_profiles_school ON learner_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_pathway ON learner_profiles(pathway_id);
CREATE INDEX IF NOT EXISTS idx_learner_learning_areas ON learner_learning_areas(learner_id);
CREATE INDEX IF NOT EXISTS idx_formative_assessments_learner ON formative_assessments(learner_id, academic_year, term);
CREATE INDEX IF NOT EXISTS idx_summative_assessments_school ON summative_assessments(school_id, academic_year, term);
CREATE INDEX IF NOT EXISTS idx_result_slips_learner ON result_slips(learner_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_bursary_applications_status ON bursary_applications(status);
CREATE INDEX IF NOT EXISTS idx_book_issuances_learner ON book_issuances(learner_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_learner ON financial_transactions(learner_id, transaction_date);

