const EXTENSION_MAP: Record<string, string> = {
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  eot: 'application/vnd.ms-fontobject',
  otf: 'font/otf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
};

const INITIATOR_MAP: Record<string, string> = {
  img: 'image/*',
  css: 'text/css',
  script: 'application/javascript',
  link: 'text/css',
  fetch: 'application/json',
  xmlhttprequest: 'application/json',
  other: 'text/plain',
};

/**
 * Infers content type from URL file extension or initiator type.
 */
export function inferContentType(url: string, initiatorType: string): string {
  try {
    const pathname = new URL(url, 'http://x').pathname;
    const lastSegment = pathname.split('/').pop() || '';
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex > 0) {
      const ext = lastSegment.slice(dotIndex + 1).toLowerCase();
      if (ext && EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];
    }
  } catch {
    // malformed URL — fall through to initiator
  }
  if (initiatorType && INITIATOR_MAP[initiatorType]) return INITIATOR_MAP[initiatorType];
  return 'application/octet-stream';
}

const TEXT_PREFIXES = ['text/', 'application/json', 'application/xml', 'application/javascript'];
const TEXT_EXACT = ['application/xhtml+xml', 'application/x-www-form-urlencoded'];

/**
 * Checks whether a content-type represents text-readable content
 * that should have its body captured.
 */
export function isTextContentType(contentType: string): boolean {
  const base = (contentType.split(';')[0] ?? contentType).trim().toLowerCase();
  for (const prefix of TEXT_PREFIXES) {
    if (base.startsWith(prefix)) return true;
  }
  return TEXT_EXACT.includes(base);
}
