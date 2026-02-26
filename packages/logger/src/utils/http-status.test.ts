import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_TEXT } from './http-status';

describe('HTTP_STATUS_TEXT', () => {
  it('maps 200 to OK', () => {
    expect(HTTP_STATUS_TEXT[200]).toBe('OK');
  });

  it('maps 404 to Not Found', () => {
    expect(HTTP_STATUS_TEXT[404]).toBe('Not Found');
  });

  it('maps 500 to Internal Server Error', () => {
    expect(HTTP_STATUS_TEXT[500]).toBe('Internal Server Error');
  });

  it('maps 301 to Moved Permanently', () => {
    expect(HTTP_STATUS_TEXT[301]).toBe('Moved Permanently');
  });

  it("maps 418 to I'm a Teapot", () => {
    expect(HTTP_STATUS_TEXT[418]).toBe("I'm a Teapot");
  });

  it('all values are non-empty strings', () => {
    for (const [code, text] of Object.entries(HTTP_STATUS_TEXT)) {
      expect(text, `status ${code}`).toBeTruthy();
      expect(typeof text).toBe('string');
    }
  });
});
