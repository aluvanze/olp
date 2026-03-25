-- Ensure school-management and teacher activation fields exist

ALTER TABLE users
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS tsc_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

CREATE TABLE IF NOT EXISTS school_pathways (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    pathway_id INTEGER REFERENCES pathways(id) ON DELETE CASCADE,
    UNIQUE(school_id, pathway_id)
);
