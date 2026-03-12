import {
  CUSTOM_EVENT_NAME,
  disableDispatch,
  enableDispatch,
  initPatches,
  requestTeardown,
} from '../src';

let pendingCleanup: (() => void) | null = null;

/**
 * Populates window.__userplane_pristine_natives with references to the
 * original, unpatched browser APIs. initPatches() requires this to exist.
 */
function ensurePristineNatives(): void {
  if (window.__userplane_pristine_natives) return;

  window.__userplane_pristine_natives = {
    fetch: window.fetch,
    xhr: {
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send,
      setRequestHeader: XMLHttpRequest.prototype.setRequestHeader,
    },
    console: {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      trace: console.trace,
    },
    history: {
      pushState: history.pushState,
      replaceState: history.replaceState,
    },
  };
}

/**
 * Sets up the logger interceptors and routes captured events to the handler.
 * Automatically cleans up previous story's logger instance.
 */
export function setupLogger(onEvent: (detail: any) => void): void {
  teardownLogger();

  if (window.__userplane_logger_loaded) {
    try {
      disableDispatch();
      requestTeardown();
    } catch {}
  }

  ensurePristineNatives();
  enableDispatch();
  initPatches();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) onEvent(detail);
  };
  document.addEventListener(CUSTOM_EVENT_NAME, handler);

  pendingCleanup = () => {
    document.removeEventListener(CUSTOM_EVENT_NAME, handler);
    disableDispatch();
    try {
      requestTeardown();
    } catch {}
  };
}

/**
 * Tears down the logger, unpatches all browser APIs, and removes listeners.
 */
export function teardownLogger(): void {
  if (pendingCleanup) {
    try {
      pendingCleanup();
    } catch {}
    pendingCleanup = null;
  }
}

/**
 * Returns whether the logger is currently active (patched and listening).
 */
export function isLoggerActive(): boolean {
  return pendingCleanup !== null;
}

// ─── Display helpers ────────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Renders a captured event as syntax-highlighted, structured JSON.
 */
export function renderStructuredEvent(detail: any): string {
  const cleaned = truncateDeep(detail);
  const json = JSON.stringify(cleaned, null, 2);
  const escaped = escapeHtml(json);
  return `<span style="color:#cdd6f4">${syntaxHighlight(escaped)}</span>`;
}

/**
 * Truncates deeply nested strings and limits array length to keep
 * the structured view readable.
 */
function truncateDeep(obj: any, maxStringLen = 120, depth = 0): any {
  if (depth > 6) return typeof obj === 'object' ? '{…}' : obj;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.length > maxStringLen ? obj.slice(0, maxStringLen) + '…' : obj;
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    const items = obj.slice(0, 10).map((v) => truncateDeep(v, maxStringLen, depth + 1));
    if (obj.length > 10) items.push(`… ${obj.length - 10} more`);
    return items;
  }
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = truncateDeep(v, maxStringLen, depth + 1);
  }
  return result;
}

/**
 * Applies syntax highlighting to an HTML-escaped JSON string.
 *
 * - Keys → blue
 * - Strings → green
 * - Numbers → orange
 * - Booleans → yellow
 * - null → gray
 */
function syntaxHighlight(html: string): string {
  return html.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // Key — strip quotes, keep colon
          const key = match.slice(1, match.lastIndexOf('"'));
          return `<span style="color:#89b4fa">${key}</span>:`;
        }
        // String value
        return `<span style="color:#a6e3a1">${match}</span>`;
      }
      if (/true|false/.test(match)) {
        return `<span style="color:#f9e2af">${match}</span>`;
      }
      if (/null/.test(match)) {
        return `<span style="color:#6c7086">${match}</span>`;
      }
      // Number
      return `<span style="color:#fab387">${match}</span>`;
    }
  );
}

// ─── Shared HTML fragments ──────────────────────────────────────────────────

export const TOGGLE_BTN_ACTIVE_STYLE =
  'padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: system-ui, sans-serif; border: 1px solid #22c55e; background: #f0fdf4; color: #166534; font-weight: 500;';

export const TOGGLE_BTN_INACTIVE_STYLE =
  'padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: system-ui, sans-serif; border: 1px solid #d1d5db; background: #f9fafb; color: #6b7280; font-weight: 500;';

export function updateToggleBtn(btn: HTMLButtonElement, active: boolean): void {
  btn.style.cssText = active ? TOGGLE_BTN_ACTIVE_STYLE : TOGGLE_BTN_INACTIVE_STYLE;
  btn.textContent = active ? '● Logger Active' : '○ Logger Stopped';
}
