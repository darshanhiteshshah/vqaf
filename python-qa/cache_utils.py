import hashlib
import json
import os
from typing import Any, Optional

try:
    import redis
except ImportError:
    redis = None


REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
CACHE_TTL_SECONDS = int(os.getenv("QA_CACHE_TTL_SECONDS", "604800"))

_client = None


def get_client():
    global _client

    if redis is None:
        return None

    if _client is None:
        try:
            _client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
            _client.ping()
        except Exception as error:
            print(f"Redis cache unavailable: {error}")
            _client = False

    return _client if _client is not False else None


def make_cache_key(namespace: str, value: str) -> str:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return f"vqaf:{namespace}:{digest}"


def get_json(key: str) -> Optional[Any]:
    client = get_client()
    if not client:
        return None

    try:
        cached = client.get(key)
        return json.loads(cached) if cached else None
    except Exception as error:
        print(f"Cache read failed for {key}: {error}")
        return None


def set_json(key: str, value: Any, ttl_seconds: int = CACHE_TTL_SECONDS) -> None:
    client = get_client()
    if not client:
        return

    try:
        client.setex(key, ttl_seconds, json.dumps(value))
    except Exception as error:
        print(f"Cache write failed for {key}: {error}")
