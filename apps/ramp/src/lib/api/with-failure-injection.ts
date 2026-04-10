import { NextRequest, NextResponse } from 'next/server';

import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

// Module-scoped request timestamps for rate limiting
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (request: NextRequest, context: any) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps Next.js route handlers with cross-cutting
 * chaos injection. Checks flags in order: rate limit → intermittent error →
 * latency → then post-response mutations (malformed JSON, partial data,
 * pagination bug).
 */
export function withFailureInjection(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const method = request.method;
    const url = request.nextUrl.pathname;

    // 1. Rate limiting
    if (isFailureActive('apiRateLimiting')) {
      const now = Date.now();
      // Prune old timestamps outside the window
      while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - RATE_LIMIT_WINDOW_MS) {
        requestTimestamps.shift();
      }
      requestTimestamps.push(now);

      if (requestTimestamps.length > RATE_LIMIT_MAX) {
        log.warn(
          { method, url, requestCount: requestTimestamps.length, windowMs: RATE_LIMIT_WINDOW_MS },
          'chaos: rate limit exceeded'
        );
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please slow down and try again.' },
          { status: 429, headers: { 'Retry-After': '10' } }
        );
      }
    }

    // 2. Intermittent errors (~30% chance)
    if (isFailureActive('apiIntermittentErrors')) {
      if (Math.random() < 0.3) {
        log.error({ method, url, injectedStatus: 500 }, 'chaos: intermittent error injected');
        return NextResponse.json(
          {
            success: false,
            error: 'Internal server error. An unexpected condition was encountered.',
          },
          { status: 500 }
        );
      }
    }

    // 3. Latency injection (2-5s random delay)
    if (isFailureActive('apiLatencyInjection')) {
      const delayMs = Math.floor(2000 + Math.random() * 3000);
      log.debug({ method, url, delayMs }, 'chaos: latency injected');
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Execute the actual handler
    const response = await handler(request, context);

    // 4. Malformed JSON (~25% chance) — return truncated body
    if (isFailureActive('apiMalformedResponse')) {
      if (Math.random() < 0.25) {
        log.warn(
          { method, url, corruption: 'truncated_json' },
          'chaos: malformed response injected'
        );
        const body = await response.text();
        // Truncate to ~60% of the body
        const truncated = body.slice(0, Math.floor(body.length * 0.6));
        return new NextResponse(truncated, {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 5. Partial data — strip employee/category fields from response objects
    if (isFailureActive('apiPartialData')) {
      try {
        const json = await response.json();
        const strippedFields: string[] = [];

        const stripRelations = (obj: Record<string, unknown>) => {
          if (Math.random() < 0.5 && 'employee' in obj) {
            delete obj.employee;
            strippedFields.push('employee');
          }
          if (Math.random() < 0.5 && 'category' in obj) {
            delete obj.category;
            strippedFields.push('category');
          }
        };

        if (Array.isArray(json.data)) {
          json.data.forEach((item: Record<string, unknown>) => stripRelations(item));
        } else if (json.data && typeof json.data === 'object') {
          stripRelations(json.data as Record<string, unknown>);
        }

        if (strippedFields.length > 0) {
          log.debug({ method, url, strippedFields }, 'chaos: partial data injected');
        }

        return NextResponse.json(json, { status: response.status });
      } catch {
        // If we can't parse the response, just return it as-is
        return response;
      }
    }

    // 6. Pagination bug — double total and inject duplicate entries
    if (isFailureActive('apiPaginationBug')) {
      try {
        const json = await response.json();

        if (typeof json.total === 'number' && Array.isArray(json.data)) {
          const realTotal = json.total;
          json.total = realTotal * 2;
          // Duplicate first few entries
          const dupes = json.data.slice(0, Math.min(3, json.data.length));
          json.data = [...json.data, ...dupes];

          log.debug(
            { method, url, realTotal, fakeTotal: json.total },
            'chaos: pagination bug injected'
          );
        }

        return NextResponse.json(json, { status: response.status });
      } catch {
        return response;
      }
    }

    return response;
  };
}
