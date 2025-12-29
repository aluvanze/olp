-- Terms Management Table
CREATE TABLE IF NOT EXISTS terms (
    id SERIAL PRIMARY KEY,
    term_number INTEGER NOT NULL CHECK (term_number >= 1 AND term_number <= 3),
    academic_year VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date_range_start VARCHAR(50) NOT NULL, -- e.g., "January"
    date_range_end VARCHAR(50) NOT NULL, -- e.g., "April"
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(term_number, academic_year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_terms_academic_year ON terms(academic_year);
CREATE INDEX IF NOT EXISTS idx_terms_active ON terms(is_active);

-- Insert default terms for 2025 if they don't exist
INSERT INTO terms (term_number, academic_year, name, date_range_start, date_range_end, is_active)
VALUES 
    (1, '2025-2026', 'Term 1 2025', 'January', 'April', true),
    (2, '2025-2026', 'Term 2 2025', 'April', 'July', true),
    (3, '2025-2026', 'Term 3 2025', 'August', 'October', true)
ON CONFLICT (term_number, academic_year) DO NOTHING;

