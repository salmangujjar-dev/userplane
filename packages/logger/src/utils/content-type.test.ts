import { describe, expect, it } from 'vitest';

import { inferContentType, isTextContentType } from './content-type';

describe('inferContentType', () => {
  it('returns text/html for .html extension', () => {
    expect(inferContentType('https://example.com/page.html', '')).toBe('text/html');
  });

  it('returns application/json for .json extension', () => {
    expect(inferContentType('https://example.com/data.json', '')).toBe('application/json');
  });

  it('returns image/png for .png extension', () => {
    expect(inferContentType('https://example.com/image.png', '')).toBe('image/png');
  });

  it('returns text/css for .css extension', () => {
    expect(inferContentType('https://example.com/style.css', '')).toBe('text/css');
  });

  it('returns octet-stream for unknown extension', () => {
    expect(inferContentType('https://example.com/file.xyz', '')).toBe('application/octet-stream');
  });

  it('falls back to initiator for no extension', () => {
    expect(inferContentType('https://example.com/api/data', 'fetch')).toBe('application/json');
  });

  it('falls back to initiator for URL with dots in path segments', () => {
    expect(inferContentType('https://example.com/api/v2.0/data', 'script')).toBe(
      'application/javascript'
    );
  });

  it('handles query strings correctly', () => {
    expect(inferContentType('https://example.com/style.css?v=2', '')).toBe('text/css');
  });

  it('falls back to initiator for img', () => {
    expect(inferContentType('https://example.com/api/image', 'img')).toBe('image/*');
  });

  it('returns octet-stream when no extension and no initiator match', () => {
    expect(inferContentType('https://example.com/api/data', '')).toBe('application/octet-stream');
  });

  it('returns octet-stream for malformed URL with no initiator', () => {
    expect(inferContentType(':::bad', '')).toBe('application/octet-stream');
  });

  it('falls back to initiator for malformed URL', () => {
    expect(inferContentType(':::bad', 'css')).toBe('text/css');
  });
});

describe('isTextContentType', () => {
  it('returns true for text/* prefixes', () => {
    expect(isTextContentType('text/html')).toBe(true);
    expect(isTextContentType('text/plain')).toBe(true);
    expect(isTextContentType('text/css')).toBe(true);
  });

  it('returns true for application/json', () => {
    expect(isTextContentType('application/json')).toBe(true);
  });

  it('returns true for application/xml', () => {
    expect(isTextContentType('application/xml')).toBe(true);
  });

  it('returns true for application/javascript', () => {
    expect(isTextContentType('application/javascript')).toBe(true);
  });

  it('returns true for application/xhtml+xml', () => {
    expect(isTextContentType('application/xhtml+xml')).toBe(true);
  });

  it('returns true for application/x-www-form-urlencoded', () => {
    expect(isTextContentType('application/x-www-form-urlencoded')).toBe(true);
  });

  it('returns false for binary types', () => {
    expect(isTextContentType('image/png')).toBe(false);
    expect(isTextContentType('application/octet-stream')).toBe(false);
    expect(isTextContentType('video/mp4')).toBe(false);
  });
});
