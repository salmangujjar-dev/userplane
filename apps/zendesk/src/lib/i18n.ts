/**
 * Translation loader following Zendesk scaffold pattern
 */

import translations from '../translations/en.json';

export function t(key: string): string {
  const keys = key.split('.');
  let result: unknown = translations;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof result === 'string' ? result : key;
}
