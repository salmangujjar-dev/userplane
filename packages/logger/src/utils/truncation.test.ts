import { describe, expect, it } from 'vitest';

import { truncatePayload } from './truncation';

interface TruncatedMeta {
  meta?: {
    truncated?: {
      trace?: boolean;
      args?: boolean;
      dropped?: boolean;
    };
  };
}

describe('truncatePayload', () => {
  it('returns event as-is when under limit', () => {
    const event = { type: 'console', args: ['hello'] };
    const result = truncatePayload(event);
    expect(result).toEqual(event);
    expect((result as TruncatedMeta).meta).toBeUndefined();
  });

  it('trims trace when over limit', () => {
    const trace = Array.from(
      { length: 500 },
      (_, i) => `frame ${i} at some/very/long/path/to/file.js:${i}:${i}`
    );
    const event = { type: 'console', args: ['short'], trace };
    const result = truncatePayload(event, 2000);
    expect(result.trace!.length).toBeLessThan(500);
    expect((result as TruncatedMeta).meta?.truncated?.trace).toBe(true);
  });

  it('collapses args when over limit and collapsed version fits', () => {
    // Many medium-length args: the JSON array form (~10KB) exceeds the limit,
    // but the collapsed single string (sliced to 5000 chars) fits within it.
    const args = Array.from({ length: 100 }, (_, i) => `argument-${i}-${'y'.repeat(80)}`);
    const event = { type: 'console', args, trace: [] as string[] };
    // ~10KB original, set limit to 6KB so collapsed (≤5050 bytes) fits but original doesn't
    const result = truncatePayload(event, 6000);
    expect((result as TruncatedMeta).meta?.truncated?.args).toBe(true);
    expect(result.args![0]).toContain('[Truncated]');
  });

  it('drops args as last resort', () => {
    // Create a payload that's huge even after collapsing
    const hugeArgs = ['x'.repeat(50000)];
    const event = { type: 'console', args: hugeArgs, trace: [] };
    const result = truncatePayload(event, 500);
    expect((result as TruncatedMeta).meta?.truncated?.dropped).toBe(true);
    expect(result.args![0]).toBe('[Dropped due to size]');
  });

  it('respects custom maxBytes parameter', () => {
    const event = { type: 'console', args: ['a'.repeat(200)] };
    // under default 30KB, but over custom 100 byte limit
    const result = truncatePayload(event, 100);
    expect((result as TruncatedMeta).meta?.truncated).toBeDefined();
  });
});
