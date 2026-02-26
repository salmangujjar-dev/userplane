// Common compound TLDs — not exhaustive but covers major cases.
// Single-label hosts and IP addresses are returned as-is.
const COMPOUND_TLDS = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'org.nz',
  'co.jp',
  'co.in',
  'com.br',
  'co.za',
  'com.sg',
  'co.kr',
  'com.mx',
  'com.ar',
  'com.tw',
  'com.hk',
  'co.id',
  'com.tr',
  'com.ua',
  'com.pk',
  'com.ng',
  'com.eg',
]);

/**
 * Extracts the registrable domain from a hostname.
 * Handles compound TLDs like co.uk, com.au, etc.
 */
export function extractDomain(hostname: string): string {
  const parts = String(hostname || '')
    .split('.')
    .filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (COMPOUND_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return lastTwo;
}

/**
 * Checks if a hostname is localhost.
 */
export function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

/**
 * Checks if two URLs are same-site (share the same registrable domain and protocol,
 * or are both localhost).
 */
export function isSameSite(a: URL, b: URL): boolean {
  return a.protocol === b.protocol && extractDomain(a.hostname) === extractDomain(b.hostname);
}

/**
 * Checks if a URL is cross-origin relative to the current page.
 */
export function isCrossOrigin(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin !== window.location.origin;
  } catch {
    return false;
  }
}
