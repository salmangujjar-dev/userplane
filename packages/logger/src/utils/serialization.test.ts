import { describe, expect, it } from 'vitest';

import { buildSelector, parseStack, serializeValue } from './serialization';

describe('buildSelector', () => {
  it('stops early when element has ID', () => {
    const el = document.createElement('div');
    el.id = 'root';
    document.body.appendChild(el);
    const selector = buildSelector(el);
    expect(selector).toContain('div#root');
    el.remove();
  });

  it('builds path with tag and className', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    child.className = 'label active';
    parent.appendChild(child);
    document.body.appendChild(parent);
    const selector = buildSelector(child);
    expect(selector).toContain('span.label.active');
    parent.remove();
  });

  it('limits depth to 6 ancestors', () => {
    let current = document.createElement('div');
    const deepest = current;
    for (let i = 0; i < 10; i++) {
      const parent = document.createElement('div');
      parent.appendChild(current);
      current = parent;
    }
    document.body.appendChild(current);
    const selector = buildSelector(deepest);
    // selector parts separated by ' > ', max 6
    const parts = selector!.split(' > ');
    expect(parts.length).toBeLessThanOrEqual(6);
    current.remove();
  });

  it('returns undefined for null input', () => {
    expect(buildSelector(null as unknown as Element)).toBeUndefined();
  });

  it('returns undefined for non-element node', () => {
    const text = document.createTextNode('hello');
    expect(buildSelector(text as unknown as Element)).toBeUndefined();
  });
});

describe('serializeValue', () => {
  it('returns string as-is', () => {
    expect(serializeValue('hello')).toBe('hello');
  });

  it('returns number as-is', () => {
    expect(serializeValue(42)).toBe(42);
  });

  it('returns boolean as-is', () => {
    expect(serializeValue(true)).toBe(true);
  });

  it('returns null as-is', () => {
    expect(serializeValue(null)).toBeNull();
  });

  it('returns undefined for undefined', () => {
    expect(serializeValue(undefined)).toBeUndefined();
  });

  it('serializes named function', () => {
    function myFunc() {}
    const result = serializeValue(myFunc) as { type: string; name: string };
    expect(result.type).toBe('function');
    expect(result.name).toBe('myFunc');
  });

  it('serializes anonymous function', () => {
    const result = serializeValue(() => {}) as { type: string; name: string };
    expect(result.type).toBe('function');
  });

  it('serializes HTMLElement', () => {
    const el = document.createElement('button');
    el.id = 'submit';
    el.className = 'btn primary';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Submit form');
    el.textContent = 'Click me';
    document.body.appendChild(el);
    const result = serializeValue(el) as Record<string, unknown>;
    expect(result.type).toBe('element');
    expect(result.tag).toBe('button');
    expect(result.id).toBe('submit');
    expect(result.class).toBe('btn primary');
    expect(result.role).toBe('button');
    expect(result.ariaLabel).toBe('Submit form');
    expect(result.text).toBe('Click me');
    el.remove();
  });

  it('truncates long text content to 120 chars', () => {
    const el = document.createElement('p');
    el.textContent = 'a'.repeat(200);
    document.body.appendChild(el);
    const result = serializeValue(el) as Record<string, unknown>;
    expect((result.text as string).length).toBeLessThanOrEqual(120);
    el.remove();
  });

  it('serializes Error', () => {
    const err = new TypeError('something went wrong');
    const result = serializeValue(err) as Record<string, unknown>;
    expect(result.type).toBe('error');
    expect(result.name).toBe('TypeError');
    expect(result.message).toBe('something went wrong');
    expect(result.stack).toBeDefined();
  });

  it('handles circular references', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = serializeValue(obj) as Record<string, unknown>;
    expect(result.self).toBe('[Circular]');
  });

  it('serializes nested function in object', () => {
    function handler() {}
    const obj = { onClick: handler };
    const result = serializeValue(obj) as Record<string, unknown>;
    const fn = result.onClick as Record<string, unknown>;
    expect(fn.type).toBe('function');
    expect(fn.name).toBe('handler');
  });

  it('serializes plain object', () => {
    const result = serializeValue({ x: 1, y: 'two' });
    expect(result).toEqual({ x: 1, y: 'two' });
  });
});

describe('parseStack', () => {
  it('parses Chrome-style stack', () => {
    const stack = `Error: test
    at myFunc (file.js:10:5)
    at otherFunc (file.js:20:3)`;
    const result = parseStack(stack);
    expect(result.top).toBe('myFunc (file.js:10:5)');
    expect(result.stackLines).toHaveLength(2);
  });

  it('parses Firefox/Safari-style stack', () => {
    const stack = `myFunc@file.js:10:5
otherFunc@file.js:20:3`;
    const result = parseStack(stack);
    expect(result.stackLines.length).toBeGreaterThan(0);
    expect(result.top).toContain('myFunc@file.js:10:5');
  });

  it('returns empty for empty stack', () => {
    const result = parseStack('');
    expect(result.top).toBe('');
    expect(result.stackLines).toEqual([]);
  });

  it('filters out non-frame lines', () => {
    const stack = `Error: test
This is not a stack frame
    at realFrame (file.js:10:5)`;
    const result = parseStack(stack);
    expect(result.stackLines).toHaveLength(1);
    expect(result.top).toBe('realFrame (file.js:10:5)');
  });
});
