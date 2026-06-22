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
]

with engine.connect() as conn:
    for sql in migrations:
        print(f"Running: {sql}")
        conn.execute(text(sql))
    conn.commit()

print("\n✅ Migration complete — all columns added successfully.")
