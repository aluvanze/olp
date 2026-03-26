-- Term fee amounts (per term) for finance balance calculations

CREATE TABLE IF NOT EXISTS term_fee_settings (
  id SERIAL PRIMARY KEY,
  term_id INTEGER UNIQUE REFERENCES terms(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_term_fee_settings_term ON term_fee_settings(term_id);

