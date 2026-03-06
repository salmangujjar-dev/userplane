/**
 * Postbridge timeout and retry defaults
 */

/** Default timeout for guest.connect() (ms) */
export const GUEST_CONNECT_TIMEOUT_MS = 15_000;

/** Default timeout for host.connect() (ms) */
export const HOST_CONNECT_TIMEOUT_MS = 15_000;

/** Default timeout for bridge.connect() (ms) */
export const BRIDGE_CONNECT_TIMEOUT_MS = 10_000;

/** Interval between guest handshake retry attempts (ms) */
export const GUEST_HANDSHAKE_RETRY_INTERVAL_MS = 500;

/** Maximum number of guest handshake retries */
export const GUEST_HANDSHAKE_MAX_RETRIES = 10;

/** Timeout for getConnectedTabs() worker response (ms) */
export const GET_CONNECTED_TABS_TIMEOUT_MS = 5_000;
