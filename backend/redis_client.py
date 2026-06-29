import os
import redis
import logging

logger = logging.getLogger("behavioredge.redis")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None
    logger.warning("Redis client could not connect. Using local in-memory fallback storage.")

# Shared in-memory fallback limits for rate-limiting and lockouts
in_memory_limits = {}  # {ip: [timestamps]}
in_memory_lockouts = {} # {ip: {"attempts": int, "lock_until": float}}
