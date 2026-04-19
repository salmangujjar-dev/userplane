export function getSafeRedirectPath(path: string | null | undefined, fallback = '/'): string {
  if (!path) return fallback;
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  if (path.includes('\\')) return fallback;

  try {
    const parsed = new URL(path, 'http://localhost');
    if (parsed.host !== 'localhost') return fallback;
  } catch {
    return fallback;
  }

  return path;
}
