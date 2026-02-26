import type { SerializedValue } from '../types';

/**
 * Builds a CSS selector path for an element (up to 6 ancestors).
 * Stops early when an element with an ID is reached.
 */
export function buildSelector(el: Element): string | undefined {
  try {
    if (!el || el.nodeType !== 1) return undefined;
    const parts: string[] = [];
    let current: Element | null = el;

    while (current && current.nodeType === 1 && parts.length < 6) {
      let segment = current.tagName.toLowerCase();

      if (current.id) {
        segment += `#${current.id}`;
        parts.unshift(segment);
        break;
      }

      const className = (current.className || '').toString().trim().replace(/\s+/g, '.');
      if (className) {
        segment += `.${className}`;
      }

      const siblings = current.parentNode ? Array.from(current.parentNode.children) : [];
      const index = siblings.indexOf(current);
      if (index >= 0) {
        segment += `:nth-child(${index + 1})`;
      }

      parts.unshift(segment);
      current = current.parentElement;
    }

    return parts.join(' > ');
  } catch {
    return undefined;
  }
}

/**
 * Safely serializes a value for logging.
 * Handles primitives, functions, HTMLElements, Errors, and objects with circular reference detection.
 */
export function serializeValue(value: unknown): SerializedValue | undefined {
  try {
    if (value === undefined) return undefined;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return value;
    }

    if (typeof value === 'function') {
      return {
        type: 'function',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- serializing unknown values requires casting to Function for name/toString
        name: (value as Function).name || 'anonymous',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- serializing unknown values requires casting to Function for name/toString
        toString: (value as Function).toString(),
      };
    }

    if (value instanceof HTMLElement) {
      return {
        type: 'element',
        tag: value.tagName ? value.tagName.toLowerCase() : undefined,
        id: value.id || undefined,
        class: (value.className || '').toString() || undefined,
        role: value.getAttribute ? (value.getAttribute('role') ?? undefined) : undefined,
        ariaLabel: value.getAttribute ? (value.getAttribute('aria-label') ?? undefined) : undefined,
        text: (value.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120) || undefined,
        selector: buildSelector(value),
      };
    }

    if (value instanceof Error) {
      return {
        type: 'error',
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (typeof value === 'object') {
      const seen = new WeakSet();
      return JSON.parse(
        JSON.stringify(value, (_key, val) => {
          if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) return '[Circular]';
            seen.add(val);
          }
          if (typeof val === 'function') {
            return {
              type: 'function',
              name: val.name || 'anonymous',
              toString: val.toString(),
            };
          }
          return val;
        })
      );
    }

    return String(value);
  } catch {
    return '[Unserializable]';
  }
}

/**
 * Parses a stack trace string into structured data.
 */
export function parseStack(stack: string): { top: string; stackLines: string[] } {
  try {
    const lines = (stack || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\s*at\s|@|:\d+:\d+/.test(line))
      .map((line) => line.replace(/^\s*at\s/, '').trim());
    return {
      top: lines[0] || '',
      stackLines: lines,
    };
  } catch {
    return { top: '', stackLines: [] };
  }
}
