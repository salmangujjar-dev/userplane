# @userplane/cache

## Purpose

`@userplane/cache` provides Upstash Redis integration for cache reads/writes and distributed rate limiting. It is designed to fail open: missing Redis config, cache misses, and Redis errors should not block application behavior.

## Import Surface

- `@userplane/cache`: Redis client helpers, `CacheService`, cache keys/TTL exports, rate limiter classes, Hono middleware helpers, and related types.
- `@userplane/cache/cache`: cache service, cache keys, TTL values, and cache-specific types.
- `@userplane/cache/rate-limit`: `RateLimiter`, `TIER_CONFIGS`, Hono middleware helpers, and rate-limit types.

## Consumers

No sibling package currently depends on `@userplane/cache` at package level. It is intended for API and server app routes that need Redis-backed caching or rate limiting.

## Quick Start

```ts
import { CacheService, createRedisClient } from '@userplane/cache';

const redis = createRedisClient({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const cache = new CacheService({
  redis,
  enabled: redis !== null,
});

const cached = await cache.getWorkspaceRecordingPrefs(workspaceId);
```

Rate limiting:

```ts
import { RateLimiter } from '@userplane/cache/rate-limit';

const limiter = new RateLimiter(redis, {
  mcp_user_minute: { limit: 120 },
});

const result = await limiter.limit('mcp_user_minute', userId);
```

## Architecture

- `src/client.ts` owns the Upstash Redis singleton helpers.
- `src/cache/cache-service.ts` owns typed cache operations and the `x-cache-bypass` helper.
- `src/cache/keys.ts` and `src/cache/ttl.ts` define cache key builders and TTLs.
- `src/rate-limit/limiter.ts` defines rate-limit tiers and Redis-backed limit checks.
- `src/rate-limit/middleware.ts` adapts rate limiting to Hono middleware.

The package accepts Redis configuration from callers instead of reading environment variables directly.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, and route-level integration tests in consuming apps.

## Env/Secrets

The package expects callers to pass Upstash Redis REST URL and token into `createRedisClient`. Common variable names in apps are typically `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, but this package only sees `{ url, token }`.

## Change Checklist

- Keep cache methods fail-open unless a caller explicitly needs hard failure behavior.
- Update keys and TTLs together when cached data shape changes.
- Check `@userplane/contract` types before changing typed cache payloads.
- Check Hono middleware behavior after rate-limit tier changes.
- Run `bun run --filter @userplane/cache typecheck` and `lint`.

## Troubleshooting

- If caching always misses, verify `createRedisClient` returned a non-null client and `CacheService` was constructed with `enabled: true`.
- If debugging needs fresh database reads, pass cache options with `bypass: true` or use the `x-cache-bypass` header helper.
- If rate limits are unexpectedly strict, check tier overrides at `RateLimiter` construction.
- If Hono types fail, ensure the consuming app provides the `hono` peer dependency.
