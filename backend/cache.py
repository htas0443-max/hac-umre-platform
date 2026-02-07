"""
Caching system for scalability
Supports both in-memory cache and Redis (when available)
"""
import os
import json
import hashlib
from typing import Optional, Any
from datetime import datetime, timedelta
from cachetools import TTLCache
import asyncio

# ============================================
# CACHE CONFIGURATION
# ============================================

# Try to import Redis, fallback to in-memory if not available
REDIS_AVAILABLE = False
redis_client = None

try:
    import redis.asyncio as redis
    REDIS_URL = os.getenv("REDIS_URL")
    if REDIS_URL:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        REDIS_AVAILABLE = True
except ImportError:
    pass

# In-memory cache fallback (TTL: 1 hour, max 1000 items)
memory_cache: TTLCache = TTLCache(maxsize=1000, ttl=3600)

# AI response cache (longer TTL: 24 hours, max 5000 items)
ai_response_cache: TTLCache = TTLCache(maxsize=5000, ttl=86400)

# ============================================
# CACHE UTILITIES
# ============================================

def generate_cache_key(prefix: str, *args) -> str:
    """Generate a consistent cache key from arguments"""
    key_data = f"{prefix}:" + ":".join(str(arg) for arg in args)
    return hashlib.sha256(key_data.encode()).hexdigest()[:32]

async def get_cached(key: str) -> Optional[str]:
    """Get value from cache (Redis first, then memory)"""
    try:
        # Try Redis first
        if REDIS_AVAILABLE and redis_client:
            value = await redis_client.get(key)
            if value:
                return value
        
        # Fallback to memory cache
        return memory_cache.get(key)
    except Exception:
        return memory_cache.get(key)

async def set_cached(key: str, value: str, ttl: int = 3600) -> bool:
    """Set value in cache (both Redis and memory)"""
    try:
        # Save to memory cache
        memory_cache[key] = value
        
        # Save to Redis if available
        if REDIS_AVAILABLE and redis_client:
            await redis_client.setex(key, ttl, value)
        
        return True
    except Exception:
        return False

async def delete_cached(key: str) -> bool:
    """Delete value from cache"""
    try:
        if key in memory_cache:
            del memory_cache[key]
        
        if REDIS_AVAILABLE and redis_client:
            await redis_client.delete(key)
        
        return True
    except Exception:
        return False

# ============================================
# AI RESPONSE CACHING
# ============================================

def get_ai_cache_key(message: str, provider: str, context_ids: Optional[list] = None) -> str:
    """Generate cache key for AI responses"""
    # Normalize message for caching
    normalized_msg = message.lower().strip()[:200]  # First 200 chars
    context_str = ",".join(sorted(context_ids)) if context_ids else ""
    return generate_cache_key("ai_chat", normalized_msg, provider, context_str)

async def get_cached_ai_response(message: str, provider: str, context_ids: Optional[list] = None) -> Optional[str]:
    """Get cached AI response if exists"""
    key = get_ai_cache_key(message, provider, context_ids)
    
    # Check in-memory AI cache first (faster)
    cached = ai_response_cache.get(key)
    if cached:
        return cached
    
    # Check Redis
    return await get_cached(key)

async def cache_ai_response(message: str, provider: str, response: str, context_ids: Optional[list] = None) -> bool:
    """Cache AI response for future use"""
    key = get_ai_cache_key(message, provider, context_ids)
    
    # Save to in-memory AI cache
    ai_response_cache[key] = response
    
    # Save to Redis with 24 hour TTL
    return await set_cached(key, response, ttl=86400)

# ============================================
# RATE LIMIT HELPERS
# ============================================

# Per-user rate limit tracking
user_rate_limits: TTLCache = TTLCache(maxsize=10000, ttl=3600)

async def check_user_rate_limit(user_id: str, limit: int = 100, window: int = 3600) -> bool:
    """Check if user is within rate limit"""
    key = f"rate:{user_id}"
    
    current = user_rate_limits.get(key, 0)
    if current >= limit:
        return False
    
    user_rate_limits[key] = current + 1
    return True

async def get_user_usage(user_id: str) -> int:
    """Get current usage count for user"""
    key = f"rate:{user_id}"
    return user_rate_limits.get(key, 0)

# ============================================
# CACHE STATISTICS
# ============================================

cache_stats = {
    "hits": 0,
    "misses": 0,
    "ai_cache_hits": 0,
    "ai_cache_misses": 0
}

def get_cache_stats() -> dict:
    """Get cache statistics"""
    total = cache_stats["hits"] + cache_stats["misses"]
    ai_total = cache_stats["ai_cache_hits"] + cache_stats["ai_cache_misses"]
    
    return {
        "memory_cache_size": len(memory_cache),
        "ai_cache_size": len(ai_response_cache),
        "hit_rate": cache_stats["hits"] / total if total > 0 else 0,
        "ai_hit_rate": cache_stats["ai_cache_hits"] / ai_total if ai_total > 0 else 0,
        "redis_available": REDIS_AVAILABLE,
        **cache_stats
    }

def record_cache_hit(is_ai: bool = False):
    """Record a cache hit"""
    cache_stats["hits"] += 1
    if is_ai:
        cache_stats["ai_cache_hits"] += 1

def record_cache_miss(is_ai: bool = False):
    """Record a cache miss"""
    cache_stats["misses"] += 1
    if is_ai:
        cache_stats["ai_cache_misses"] += 1
