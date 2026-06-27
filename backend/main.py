from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import auth, trades, profile, coach, dashboard, rules, journal_trades, journal_elements
import os

Base.metadata.create_all(bind=engine)

# Programmatic startup migrations to keep production schema synchronized
from sqlalchemy import text
migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR DEFAULT 'Intermediate';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General';",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS times_checked INTEGER DEFAULT 0;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS times_broken INTEGER DEFAULT 0;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
]
with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            conn.commit()
        except Exception as e:
            print(f"Startup migration status: {sql} -> {e}")

os.makedirs("avatars", exist_ok=True)

app = FastAPI(
    title="BehaviorEdge API",
    description="AI-Based Behavioral Risk Regulation Platform for Traders",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://behavior-edge.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/avatars", StaticFiles(directory="avatars"), name="avatars")

app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(profile.router)
app.include_router(coach.router)
app.include_router(dashboard.router)
app.include_router(rules.router)
app.include_router(journal_trades.router, prefix="/api")
app.include_router(journal_elements.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "BehaviorEdge API is running"}
