import { describe, expect, it } from 'vitest';

import { parseFetchBody, parseXHRBody } from './body-parser';

describe('parseFetchBody', () => {
  it('parses JSON string', () => {
    const result = parseFetchBody('{"key":"value"}');
    expect(result.type).toBe('json');
    expect(result.body).toEqual({ key: 'value' });
  });

  it('parses plain string', () => {
    const result = parseFetchBody('hello world');
    expect(result.type).toBe('string');
    expect(result.body).toBe('hello world');
  });

  it('parses FormData', () => {
    const fd = new FormData();
    fd.append('name', 'test');
    fd.append('value', '123');
    const result = parseFetchBody(fd);
    expect(result.type).toBe('FormData');
    expect(result.body).toEqual({ name: 'test', value: '123' });
  });

  it('parses URLSearchParams', () => {
    const params = new URLSearchParams({ a: '1', b: '2' });
    const result = parseFetchBody(params);
    expect(result.type).toBe('URLSearchParams');
    expect(result.body).toBe('a=1&b=2');
  });

  it('returns null body for Blob', () => {
    const blob = new Blob(['data']);
    const result = parseFetchBody(blob);
    expect(result.type).toBe('Blob');
    expect(result.body).toBeNull();
  });

  it('returns null body for ArrayBuffer', () => {
    const buf = new ArrayBuffer(8);
    const result = parseFetchBody(buf);
    expect(result.type).toBe('ArrayBuffer');
    expect(result.body).toBeNull();
  });

  it('returns unknown for null/undefined', () => {
    expect(parseFetchBody(null).type).toBe('unknown');
    expect(parseFetchBody(undefined).type).toBe('unknown');
  });
});

describe('parseXHRBody', () => {
  it('parses JSON string', () => {
    const result = parseXHRBody('{"key":"value"}');
    expect(result.type).toBe('json');
    expect(result.body).toEqual({ key: 'value' });
  });

  it('parses plain string as text', () => {
    const result = parseXHRBody('hello world');
    expect(result.type).toBe('text');
    expect(result.body).toBe('hello world');
  });

  it('parses FormData', () => {
    const fd = new FormData();
    fd.append('key', 'val');
    const result = parseXHRBody(fd);
    expect(result.type).toBe('FormData');
    expect(result.body).toEqual({ key: 'val' });
  });

  it('returns null body for Blob', () => {
    const blob = new Blob(['data']);
    const result = parseXHRBody(blob);
    expect(result.type).toBe('Blob');
    expect(result.body).toBeNull();
  });

  it('returns null body for ArrayBuffer', () => {
    const buf = new ArrayBuffer(8);
    const result = parseXHRBody(buf);
    expect(result.type).toBe('ArrayBuffer');
    expect(result.body).toBeNull();
  });

  it('parses URLSearchParams', () => {
    const params = new URLSearchParams({ x: '1' });
    const result = parseXHRBody(params);
    expect(result.type).toBe('URLSearchParams');
    expect(result.body).toBe('x=1');
  });

  it('returns other for non-null unknown types', () => {
    const result = parseXHRBody(42);
    expect(result.type).toBe('other');
    expect(result.body).toBe(42);
  });

  it('returns unknown for null', () => {
    expect(parseXHRBody(null).type).toBe('unknown');
    expect(parseXHRBody(null).body).toBeNull();
  });
});

describe('consistency', () => {
  it('both parsers produce same output for JSON string', () => {
    const input = '{"a":1}';
    const fetchResult = parseFetchBody(input);
    const xhrResult = parseXHRBody(input);
    expect(fetchResult.type).toBe('json');
    expect(xhrResult.type).toBe('json');
    expect(fetchResult.body).toEqual(xhrResult.body);
  });
});
