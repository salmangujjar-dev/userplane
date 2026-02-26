import { describe, expect, it } from 'vitest';

import { parseResponseHeaders } from './headers';

describe('parseResponseHeaders', () => {
  it('parses LF-separated headers', () => {
    const raw = 'Content-Type: application/json\nContent-Length: 42';
    expect(parseResponseHeaders(raw)).toEqual({
      'Content-Type': 'application/json',
      'Content-Length': '42',
    });
  });

  it('parses CRLF-separated headers', () => {
    const raw = 'Content-Type: text/html\r\nX-Custom: value';
    expect(parseResponseHeaders(raw)).toEqual({
      'Content-Type': 'text/html',
      'X-Custom': 'value',
    });
  });

  it('preserves colons in header values', () => {
    const raw = 'Location: https://example.com:8080/path';
    expect(parseResponseHeaders(raw)).toEqual({
      Location: 'https://example.com:8080/path',
    });
  });

  it('returns empty object for empty input', () => {
    expect(parseResponseHeaders('')).toEqual({});
  });

  it('parses single header', () => {
    const raw = 'X-Request-Id: abc123';
    expect(parseResponseHeaders(raw)).toEqual({
      'X-Request-Id': 'abc123',
    });
  });

  it('handles multi-header string with trailing newline', () => {
    const raw = 'Content-Type: text/html\nX-Powered-By: Express\n';
    expect(parseResponseHeaders(raw)).toEqual({
      'Content-Type': 'text/html',
      'X-Powered-By': 'Express',
    });
  });
});
