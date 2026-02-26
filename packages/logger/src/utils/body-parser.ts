import type { ParsedBody } from '../types';

/**
 * Parses a fetch request body into a structured format.
 * Attempts JSON parse for strings, extracts FormData entries, etc.
 */
export function parseFetchBody(body: unknown): ParsedBody {
  const result: ParsedBody = { type: 'unknown', body: null };

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      result.type = 'json';
      result.body = parsed;
    } catch {
      result.type = 'string';
      result.body = body;
    }
  } else if (body instanceof FormData) {
    const entries: Record<string, FormDataEntryValue> = {};
    for (const [key, value] of body.entries()) {
      entries[key] = value;
    }
    result.type = 'FormData';
    result.body = entries;
  } else if (body instanceof URLSearchParams) {
    result.type = 'URLSearchParams';
    result.body = body.toString();
  } else if (body instanceof Blob) {
    result.type = 'Blob';
    result.body = null;
  } else if (body instanceof ArrayBuffer) {
    result.type = 'ArrayBuffer';
    result.body = null;
  }

  return result;
}

/**
 * Parses an XHR request body into a structured format.
 * Similar to parseFetchBody but handles XHR-specific body types.
 */
export function parseXHRBody(body: unknown): ParsedBody {
  const result: ParsedBody = { type: 'unknown', body: null };

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      result.type = 'json';
      result.body = parsed;
    } catch {
      result.type = 'text';
      result.body = body;
    }
  } else if (body instanceof FormData) {
    const entries: Record<string, FormDataEntryValue> = {};
    for (const [key, value] of body.entries()) {
      entries[key] = value;
    }
    result.type = 'FormData';
    result.body = entries;
  } else if (body instanceof Blob) {
    result.type = 'Blob';
    result.body = null;
  } else if (body instanceof ArrayBuffer) {
    result.type = 'ArrayBuffer';
    result.body = null;
  } else if (body instanceof URLSearchParams) {
    result.type = 'URLSearchParams';
    result.body = body.toString();
  } else if (body != null) {
    result.type = 'other';
    result.body = body;
  }

  return result;
}
