const DEFAULT_MAX_BYTES = 30720; // 30KB
const encoder = new TextEncoder();

/**
 * Truncates a log event payload to fit within the byte limit.
 * Strategy:
 *   1. If under limit, return as-is
 *   2. Pop trace lines (batch-estimated)
 *   3. Collapse args into a single truncated string
 *   4. Clear trace entirely
 *   5. Drop args as last resort
 */
export function truncatePayload<T extends Record<string, unknown>>(
  event: T,
  maxBytes: number = DEFAULT_MAX_BYTES
): T {
  let json = JSON.stringify(event);
  let byteLength = encoder.encode(json).length;

  if (byteLength <= maxBytes) return event;

  const e = event as Record<string, unknown>;
  e.meta = (e.meta as Record<string, unknown>) || {};
  (e.meta as Record<string, unknown>).truncated =
    ((e.meta as Record<string, unknown>).truncated as Record<string, boolean>) || {};
  const truncated = (e.meta as Record<string, unknown>).truncated as Record<string, boolean>;

  // Step 1: Trim trace entries (batch estimate to avoid N re-encodes)
  if (Array.isArray(e.trace) && (e.trace as unknown[]).length > 0) {
    const trace = e.trace as unknown[];
    // Estimate bytes per entry from the first pop
    trace.pop();
    json = JSON.stringify(event);
    const newByteLength = encoder.encode(json).length;
    const bytesPerEntry = byteLength - newByteLength;
    byteLength = newByteLength;

    if (byteLength > maxBytes && bytesPerEntry > 0) {
      const remaining = byteLength - maxBytes;
      const toPop = Math.min(Math.ceil(remaining / bytesPerEntry), trace.length);
      trace.splice(trace.length - toPop, toPop);
      json = JSON.stringify(event);
      byteLength = encoder.encode(json).length;
    }

    // Safety: if still over, pop remaining one at a time
    while (byteLength > maxBytes && trace.length > 0) {
      trace.pop();
      json = JSON.stringify(event);
      byteLength = encoder.encode(json).length;
    }

    if (byteLength <= maxBytes) {
      truncated.trace = true;
      return event;
    }
  }

  // Step 2: Collapse args
  if (Array.isArray(e.args) && (e.args as unknown[]).length) {
    const combined = (e.args as unknown[])
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');
    e.args = [`[Truncated] ${combined.slice(0, 5000)}`];
    truncated.args = true;
    json = JSON.stringify(event);
    byteLength = encoder.encode(json).length;
    if (byteLength <= maxBytes) return event;
  }

  // Step 3: Clear trace completely
  if (e.trace && (e.trace as unknown[]).length) {
    e.trace = [];
    truncated.trace = true;
  }

  // Step 4: Drop args entirely
  if (encoder.encode(JSON.stringify(event)).length > maxBytes) {
    e.args = ['[Dropped due to size]'];
    truncated.dropped = true;
  }

  return event;
}
