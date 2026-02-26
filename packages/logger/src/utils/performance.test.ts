import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NetworkResponseInfo } from '../types';
import { enrichWithPerformance, extractPerformanceData } from './performance';

function makeEntry(overrides: Partial<PerformanceResourceTiming> = {}): PerformanceResourceTiming {
  return {
    nextHopProtocol: 'h2',
    encodedBodySize: 1024,
    decodedBodySize: 2048,
    transferSize: 1100,
    domainLookupStart: 1,
    domainLookupEnd: 2,
    connectStart: 3,
    connectEnd: 4,
    secureConnectionStart: 3.5,
    requestStart: 5,
    responseStart: 6,
    responseEnd: 7,
    startTime: 0.5,
    duration: 6.5,
    initiatorType: 'fetch',
    name: 'https://example.com/api',
    entryType: 'resource',
    toJSON: () => ({}),
    ...overrides,
  } as PerformanceResourceTiming;
}

describe('extractPerformanceData', () => {
  it('maps all 14 fields correctly', () => {
    const entry = makeEntry();
    const data = extractPerformanceData(entry);

    expect(data.nextHopProtocol).toBe('h2');
    expect(data.encodedBodySize).toBe(1024);
    expect(data.decodedBodySize).toBe(2048);
    expect(data.transferSize).toBe(1100);
    expect(data.domainLookupStart).toBe(1);
    expect(data.domainLookupEnd).toBe(2);
    expect(data.connectStart).toBe(3);
    expect(data.connectEnd).toBe(4);
    expect(data.secureConnectionStart).toBe(3.5);
    expect(data.requestStart).toBe(5);
    expect(data.responseStart).toBe(6);
    expect(data.responseEnd).toBe(7);
    expect(data.startTime).toBe(0.5);
    expect(data.duration).toBe(6.5);
  });

  it('returns object with exactly 14 keys', () => {
    const data = extractPerformanceData(makeEntry());
    expect(Object.keys(data)).toHaveLength(14);
  });
});

describe('enrichWithPerformance', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { href: 'https://example.com/' },
    });
  });

  it('enriches response with performance data when entry found', () => {
    const entry = makeEntry({ initiatorType: 'fetch' });
    vi.stubGlobal('performance', {
      getEntriesByName: vi.fn().mockReturnValue([entry]),
    });

    const response: NetworkResponseInfo = { status: 200, headers: {}, body: null };
    enrichWithPerformance('https://example.com/api', 'fetch', response);

    expect(response.performance).toBeDefined();
    expect(response.performance!.nextHopProtocol).toBe('h2');
  });

  it('falls back to last entry when initiatorType does not match', () => {
    const entry1 = makeEntry({ initiatorType: 'other' as string, duration: 100 });
    const entry2 = makeEntry({ initiatorType: 'other' as string, duration: 200 });
    vi.stubGlobal('performance', {
      getEntriesByName: vi.fn().mockReturnValue([entry1, entry2]),
    });

    const response: NetworkResponseInfo = { status: 200, headers: {}, body: null };
    enrichWithPerformance('https://example.com/api', 'fetch', response);

    expect(response.performance).toBeDefined();
    expect(response.performance!.duration).toBe(200);
  });

  it('does not set performance when no entries found', () => {
    vi.stubGlobal('performance', {
      getEntriesByName: vi.fn().mockReturnValue([]),
    });

    const response: NetworkResponseInfo = { status: 200, headers: {}, body: null };
    enrichWithPerformance('https://example.com/api', 'fetch', response);

    expect(response.performance).toBeUndefined();
  });

  it('resolves relative URL against window.location.href', () => {
    const entry = makeEntry();
    const getEntriesByName = vi.fn().mockReturnValue([entry]);
    vi.stubGlobal('performance', { getEntriesByName });

    const response: NetworkResponseInfo = { status: 200, headers: {}, body: null };
    enrichWithPerformance('/api/data', 'fetch', response);

    expect(getEntriesByName).toHaveBeenCalledWith('https://example.com/api/data', 'resource');
  });
});
