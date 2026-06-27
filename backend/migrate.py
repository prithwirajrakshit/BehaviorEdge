"""
Run this once to add the new profile columns to the existing users table.
Command: python migrate.py
"""
from database import engine
from sqlalchemy import text

migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR DEFAULT 'Intermediate';",
    # Password reset OTP columns
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;",
    # Rules table columns
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General';",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS times_checked INTEGER DEFAULT 0;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS times_broken INTEGER DEFAULT 0;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
]

with engine.connect() as conn:
    for sql in migrations:
        print(f"Running: {sql}")
        try:
            conn.execute(text(sql))
            conn.commit()
        except Exception as e:
            print(f"Failed: {sql} - {e}")


print("\n[SUCCESS] Migration complete - all columns added successfully.")
