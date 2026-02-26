import { describe, expect, it } from 'vitest';

import { cleanPayload } from './clean';

describe('cleanPayload', () => {
  it('removes null values', () => {
    const event = { a: 1, b: null } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result).not.toHaveProperty('b');
    expect(result.a).toBe(1);
  });

  it('removes undefined values', () => {
    const event = { a: 'hello', b: undefined } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result).not.toHaveProperty('b');
  });

  it('removes empty arrays', () => {
    const event = { a: 1, items: [] } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result).not.toHaveProperty('items');
  });

  it('removes empty objects', () => {
    const event = { a: 1, meta: {} } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result).not.toHaveProperty('meta');
  });

  it('preserves non-empty arrays', () => {
    const event = { items: [1, 2, 3] } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result.items).toEqual([1, 2, 3]);
  });

  it('preserves non-empty objects', () => {
    const event = { meta: { key: 'val' } } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result.meta).toEqual({ key: 'val' });
  });

  it('preserves false', () => {
    const event = { active: false } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result.active).toBe(false);
  });

  it('preserves 0', () => {
    const event = { count: 0 } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result.count).toBe(0);
  });

  it('preserves empty string', () => {
    const event = { name: '' } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result.name).toBe('');
  });

  it('mutates and returns the same object', () => {
    const event = { a: 1, b: null } as Record<string, unknown>;
    const result = cleanPayload(event);
    expect(result).toBe(event);
  });
});
