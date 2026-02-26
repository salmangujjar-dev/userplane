/**
 * Parses raw HTTP response header string into a key-value object.
 */
export function parseResponseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {};
  raw
    .trim()
    .split(/\r?\n/)
    .forEach((line) => {
      const parts = line.split(': ');
      const key = parts.shift();
      const value = parts.join(': ');
      if (key) {
        headers[key] = value;
      }
    });
  return headers;
}
