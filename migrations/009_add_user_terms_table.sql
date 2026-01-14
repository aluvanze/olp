-- User-Terms Relationship Table
-- Allows linking users (students, teachers, etc.) to specific terms
CREATE TABLE IF NOT EXISTS user_terms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    added_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, term_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_terms_user_id ON user_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_terms_term_id ON user_terms(term_id);
CREATE INDEX IF NOT EXISTS idx_user_terms_added_by ON user_terms(added_by);

