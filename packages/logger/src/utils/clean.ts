/**
 * Removes null/undefined values and empty arrays/objects from a log event.
 * Keeps the payload lean for transmission.
 */
export function cleanPayload<T extends Record<string, unknown>>(event: T): T {
  Object.keys(event).forEach((key) => {
    const val = event[key];
    if (val == null) {
      delete event[key];
    } else if (Array.isArray(val) && val.length === 0) {
      delete event[key];
    } else if (
      typeof val === 'object' &&
      !Array.isArray(val) &&
      Object.keys(val as object).length === 0
    ) {
      delete event[key];
    }
  });
  return event;
}
