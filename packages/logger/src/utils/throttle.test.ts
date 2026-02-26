import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We need to mock performance.now before importing the module
let shouldLogNetwork: typeof import('./throttle').shouldLogNetwork;
let shouldLogNavigation: typeof import('./throttle').shouldLogNavigation;

describe('shouldLogNetwork', () => {
  let now = 1000;

  beforeEach(async () => {
    vi.stubGlobal('performance', {
      now: vi.fn(() => now),
    });
    // Re-import to get fresh module state with mocked performance
    vi.resetModules();
    const mod = await import('./throttle');
    shouldLogNetwork = mod.shouldLogNetwork;
    shouldLogNavigation = mod.shouldLogNavigation;
    now = 1000;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true on first call', () => {
    expect(shouldLogNetwork('fetch|GET|/api|200')).toBe(true);
  });

  it('returns false for rapid duplicate', () => {
    shouldLogNetwork('fetch|GET|/api|200');
    now = 1050; // only 50ms later
    expect(shouldLogNetwork('fetch|GET|/api|200')).toBe(false);
  });

  it('returns true after throttle window passes', () => {
    shouldLogNetwork('fetch|GET|/api|200');
    now = 1300; // 300ms later, past 200ms throttle
    expect(shouldLogNetwork('fetch|GET|/api|200')).toBe(true);
  });

  it('does not interfere between different keys', () => {
    shouldLogNetwork('fetch|GET|/api/a|200');
    expect(shouldLogNetwork('fetch|GET|/api/b|200')).toBe(true);
  });
});

describe('shouldLogNavigation', () => {
  let now = 1000;

  beforeEach(async () => {
    vi.stubGlobal('performance', {
      now: vi.fn(() => now),
    });
    vi.resetModules();
    const mod = await import('./throttle');
    shouldLogNetwork = mod.shouldLogNetwork;
    shouldLogNavigation = mod.shouldLogNavigation;
    now = 1000;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true on first call', () => {
    expect(shouldLogNavigation('pushState', '/a', '/b')).toBe(true);
  });

  it('returns false for rapid duplicate', () => {
    shouldLogNavigation('pushState', '/a', '/b');
    now = 1050;
    expect(shouldLogNavigation('pushState', '/a', '/b')).toBe(false);
  });

  it('returns true after throttle window passes', () => {
    shouldLogNavigation('pushState', '/a', '/b');
    now = 1300;
    expect(shouldLogNavigation('pushState', '/a', '/b')).toBe(true);
  });

  it('does not interfere between different navigations', () => {
    shouldLogNavigation('pushState', '/a', '/b');
    expect(shouldLogNavigation('replaceState', '/a', '/b')).toBe(true);
  });
});
