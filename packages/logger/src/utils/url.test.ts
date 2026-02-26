import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractDomain, isCrossOrigin, isLocalhost, isSameSite } from './url';

describe('extractDomain', () => {
  it('returns simple hostname as-is', () => {
    expect(extractDomain('example.com')).toBe('example.com');
  });

  it('extracts domain from subdomain', () => {
    expect(extractDomain('www.example.com')).toBe('example.com');
  });

  it('handles compound TLD co.uk', () => {
    expect(extractDomain('www.example.co.uk')).toBe('example.co.uk');
  });

  it('handles compound TLD com.br', () => {
    expect(extractDomain('app.example.com.br')).toBe('example.com.br');
  });

  it('handles compound TLD co.in', () => {
    expect(extractDomain('sub.example.co.in')).toBe('example.co.in');
  });

  it('returns single-label host as-is', () => {
    expect(extractDomain('localhost')).toBe('localhost');
  });

  it('returns IP address as-is', () => {
    expect(extractDomain('192.168.1.1')).toBe('1.1');
  });

  it('handles empty string', () => {
    expect(extractDomain('')).toBe('');
  });

  it('handles deeply nested subdomain', () => {
    expect(extractDomain('a.b.c.example.com')).toBe('example.com');
  });
});

describe('isLocalhost', () => {
  it('returns true for localhost', () => {
    expect(isLocalhost('localhost')).toBe(true);
  });

  it('returns true for 127.0.0.1', () => {
    expect(isLocalhost('127.0.0.1')).toBe(true);
  });

  it('returns true for ::1', () => {
    expect(isLocalhost('::1')).toBe(true);
  });

  it('returns false for non-localhost', () => {
    expect(isLocalhost('example.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLocalhost('')).toBe(false);
  });
});

describe('isSameSite', () => {
  it('returns true for same domain same protocol', () => {
    const a = new URL('https://example.com/a');
    const b = new URL('https://example.com/b');
    expect(isSameSite(a, b)).toBe(true);
  });

  it('returns true for subdomains of the same registrable domain', () => {
    const a = new URL('https://app.example.com');
    const b = new URL('https://api.example.com');
    expect(isSameSite(a, b)).toBe(true);
  });

  it('returns false for same domain different protocol', () => {
    const a = new URL('https://example.com');
    const b = new URL('http://example.com');
    expect(isSameSite(a, b)).toBe(false);
  });

  it('returns false for different domains', () => {
    const a = new URL('https://example.com');
    const b = new URL('https://other.com');
    expect(isSameSite(a, b)).toBe(false);
  });

  it('handles compound TLDs', () => {
    const a = new URL('https://app.example.co.uk');
    const b = new URL('https://www.example.co.uk');
    expect(isSameSite(a, b)).toBe(true);
  });
});

describe('isCrossOrigin', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { origin: 'https://example.com', href: 'https://example.com/' },
    });
  });

  it('returns false for same origin', () => {
    expect(isCrossOrigin('https://example.com/path')).toBe(false);
  });

  it('returns true for cross origin', () => {
    expect(isCrossOrigin('https://other.com/path')).toBe(true);
  });

  it('returns false for relative URL', () => {
    expect(isCrossOrigin('/api/data')).toBe(false);
  });

  it('returns false for malformed URL', () => {
    expect(isCrossOrigin('not a url %%')).toBe(false);
  });

  it('returns true for different port', () => {
    expect(isCrossOrigin('https://example.com:8080/path')).toBe(true);
  });
});
