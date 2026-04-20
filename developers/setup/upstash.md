# Upstash

Managed Redis for caching and rate limiting in the Userplane API.

## When you need this

Work involving API caching behavior or rate limiting. If you do not need caching or rate limiting, set `CACHE_ENABLED=false` and `RATE_LIMIT_ENABLED=false` in your env file and skip this setup entirely.

## Setup

1. Sign up at [console.upstash.com](https://console.upstash.com) using GitHub, Google, or email.
2. Click **Create Database**.
3. Choose a name and select the region closest to you.
4. Once created, scroll to the **REST API** section.
5. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values.

## Environment Variables

Set the following in `apps/api/.env.development`:

```
UPSTASH_REDIS_REST_URL=https://[name]-[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true
```

## Verify

Start the API server. It should start without Redis connection errors when `CACHE_ENABLED=true` and `RATE_LIMIT_ENABLED=true` are set.

## Notes

- Free tier provides 256 MB storage, 500K commands per month, and up to 10 databases.
- If you do not need caching or rate limiting during development, set `CACHE_ENABLED=false` and `RATE_LIMIT_ENABLED=false`. No Redis setup is required in that case.
