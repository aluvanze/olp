-- Seed default deployment accounts (idempotent)
-- Default password for all seeded accounts: 123456.ab
-- bcrypt hash generated via bcryptjs

-- Ensure office roles exist (safe if already present)
DO $$
BEGIN
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_county_office';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'county_office';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'national_office';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
VALUES
  ('finance', 'finance@school.com', '$2a$10$7KZIdytGQQj4HVJJ1mHJHOqNeJPtYfQYd/42nsOSGRx5xRZhnYYOC', 'Finance', 'Administrator', 'finance', true),
  ('subcounty_office_1', 'subcounty.office@olp.local', '$2a$10$7KZIdytGQQj4HVJJ1mHJHOqNeJPtYfQYd/42nsOSGRx5xRZhnYYOC', 'Sub-County', 'Office', 'sub_county_office', true),
  ('county_office_1', 'county.office@olp.local', '$2a$10$7KZIdytGQQj4HVJJ1mHJHOqNeJPtYfQYd/42nsOSGRx5xRZhnYYOC', 'County', 'Office', 'county_office', true),
  ('national_office_1', 'national.office@olp.local', '$2a$10$7KZIdytGQQj4HVJJ1mHJHOqNeJPtYfQYd/42nsOSGRx5xRZhnYYOC', 'National', 'Office', 'national_office', true)
ON CONFLICT (email) DO UPDATE
SET username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

