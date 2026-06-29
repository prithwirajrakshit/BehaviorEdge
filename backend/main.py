import os
import sys
import time
import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from logging_config import setup_logging, log_system_error, logger
from routers import auth, trades, profile, coach, dashboard, rules, journal_trades, journal_elements, webhooks

# Initialize structured JSON logging
setup_logging()

# Synchronize Database schema
Base.metadata.create_all(bind=engine)

# Programmatic startup migrations to keep production schema synchronized
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
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id VARCHAR UNIQUE;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General';",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS times_checked INTEGER DEFAULT 0;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS times_broken INTEGER DEFAULT 0;",
    "ALTER TABLE rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
    "ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS emotion_before VARCHAR DEFAULT 'Neutral';",
    "ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS emotion_after VARCHAR DEFAULT 'Neutral';"
]
with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            conn.commit()
        except Exception as e:
            logger.warning(f"Startup migration warning: {sql} -> {e}")

os.makedirs("avatars", exist_ok=True)

app = FastAPI(
    title="BehaviorEdge API",
    description="AI-Based Behavioral Risk Regulation Platform for Traders",
    version="1.0.0"
)

# CORS lockdown based on environment
ENV = os.getenv("ENV", "production")
if ENV == "production":
    allow_origins = [
        "https://behavior-edge.vercel.app"
    ]
    allow_origin_regex = None
else:
    allow_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    allow_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Redis for rate-limiting
from redis_client import redis_client, in_memory_limits, in_memory_lockouts

# Global security middleware for rate limiting and lockouts
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    client_ip = request.client.host
    path = request.url.path
    current_time = time.time()
    
    # 1. Rate Limiting for /auth/login and /auth/signup (10 requests per IP per minute)
    if path in ["/auth/login", "/auth/signup"]:
        if redis_client:
            # Redis-backed rate limiter
            key = f"rate_limit:{client_ip}"
            pipeline = redis_client.pipeline()
            pipeline.zadd(key, {str(current_time): current_time})
            pipeline.zremrangebyscore(key, 0, current_time - 60)
            pipeline.zcard(key)
            pipeline.expire(key, 60)
            _, _, request_count, _ = pipeline.execute()
            
            if request_count > 10:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
        else:
            # In-memory rate limiter fallback
            if client_ip not in in_memory_limits:
                in_memory_limits[client_ip] = []
            # Clean old timestamps (older than 60s)
            in_memory_limits[client_ip] = [t for t in in_memory_limits[client_ip] if t > current_time - 60]
            in_memory_limits[client_ip].append(current_time)
            
            if len(in_memory_limits[client_ip]) > 10:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )

    # 2. Account Lockout Middleware (15-minute freeze after 5 failed login attempts)
    if path == "/auth/login":
        lock_key = f"lockout:ip:{client_ip}"
        if redis_client:
            is_locked = redis_client.get(lock_key)
            if is_locked:
                return JSONResponse(
                    status_code=423,
                    content={"detail": "Account locked due to consecutive failed login attempts. Please try again in 15 minutes."}
                )
        else:
            lock_info = in_memory_lockouts.get(client_ip, {})
            lock_until = lock_info.get("lock_until", 0)
            if current_time < lock_until:
                return JSONResponse(
                    status_code=423,
                    content={"detail": "Account locked due to consecutive failed login attempts. Please try again in 15 minutes."}
                )

    response = await call_next(request)
    return response

# Custom Global Exception Handlers (no stack traces leaked to client)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    log_system_error(str(exc), request.url.path, request.client.host)
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error. Please verify your inputs."}
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    log_system_error(str(exc), request.url.path, request.client.host, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred. The incident has been logged."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log_system_error(str(exc), request.url.path, request.client.host, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact support."}
    )

# Routers integration
app.mount("/avatars", StaticFiles(directory="avatars"), name="avatars")
app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(profile.router)
app.include_router(coach.router)
app.include_router(dashboard.router)
app.include_router(rules.router)
app.include_router(journal_trades.router, prefix="/api")
app.include_router(journal_elements.router, prefix="/api")
app.include_router(webhooks.router)

@app.get("/")
def root():
    return {"message": "BehaviorEdge API is running"}
