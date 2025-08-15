import redis.asyncio as redis
from app.core.config import settings
import json
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        if not self.redis:
            return None
        try:
            value = await self.redis.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None
    
    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Set value in Redis with expiration"""
        if not self.redis:
            return False
        try:
            await self.redis.setex(key, expire, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        if not self.redis:
            return False
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return False
    
    async def publish(self, channel: str, message: Any) -> bool:
        """Publish message to Redis channel"""
        if not self.redis:
            return False
        try:
            await self.redis.publish(channel, json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Redis PUBLISH error: {e}")
            return False

# Global Redis client instance
redis_client = RedisClient()