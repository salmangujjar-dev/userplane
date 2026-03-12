import type { Meta, StoryObj } from '@storybook/html-vite';

import {
  escapeHtml,
  formatTime,
  isLoggerActive,
  renderStructuredEvent,
  setupLogger,
  teardownLogger,
  updateToggleBtn,
} from './story-cleanup';

const btnBase =
  'padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: system-ui, sans-serif; transition: opacity 0.15s;';

const STORYBOOK_PATTERNS = [
  '/@',
  '/__vite',
  '/node_modules/',
  'hot-update',
  'storybook',
  '/sb-',
  'iframe.html',
];

function isStorybookUrl(url: string): boolean {
  return STORYBOOK_PATTERNS.some((p) => url.includes(p));
}

const meta: Meta = {
  title: 'Demos/Network Capture',
  parameters: {
    docs: {
      description: {
        component:
          'The logger intercepts both fetch and XMLHttpRequest, capturing request/response data, headers, and performance timing.',
      },
    },
  },
};

export default meta;

export const LiveDemo: StoryObj = {
  name: 'Live Network Capture',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 860px;">
        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">Network Interceptor</h2>
        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
          Click buttons to make real <code>fetch</code> requests. The logger captures the full
          request/response lifecycle including headers, status, and performance timing.
        </p>

        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
          <button id="btn-toggle" style=""></button>
          <button id="btn-get" style="${btnBase} border: 1px solid #86efac; background: #f0fdf4; color: #166534;">
            GET /todos/1
          </button>
          <button id="btn-post" style="${btnBase} border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;">
            POST /posts
          </button>
          <button id="btn-404" style="${btnBase} border: 1px solid #fde68a; background: #fffbeb; color: #92400e;">
            GET (404)
          </button>
          <button id="btn-error" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            Network Error
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
          <button id="btn-clear" style="padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; color: #666;">
            Clear Log
          </button>
          <span id="event-count" style="font-size: 12px; color: #888;">0 requests captured</span>
        </div>

        <div id="event-log" style="background: #1e1e2e; border-radius: 8px; padding: 16px; min-height: 260px; max-height: 420px; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 12px; line-height: 1.5;">
          <div style="color: #6c7086;">Waiting for network events…</div>
        </div>
      </div>
    `;

    const eventLog = container.querySelector('#event-log') as HTMLElement;
    const countEl = container.querySelector('#event-count') as HTMLElement;
    let eventCount = 0;
    let ready = false;

    const statusColor = (status: number) => {
      if (status >= 200 && status < 300) return '#a6e3a1';
      if (status >= 300 && status < 400) return '#f9e2af';
      if (status >= 400) return '#f38ba8';
      return '#cdd6f4';
    };

    const durationColor = (ms: number) => {
      if (ms < 200) return '#a6e3a1';
      if (ms < 500) return '#f9e2af';
      return '#f38ba8';
    };

    const addEntry = (detail: any) => {
      // Extract data from request/response sub-objects
      const req = detail.request || {};
      const res = detail.response || {};
      const url = req.url || detail.url || '';
      if (isStorybookUrl(url)) return;

      if (eventCount === 0) eventLog.innerHTML = '';
      eventCount++;
      countEl.textContent = `${eventCount} request${eventCount !== 1 ? 's' : ''} captured`;

      const isError = detail.type === 'network-error';
      const method = req.method || detail.method || 'GET';
      const status = res.status || 0;
      const duration = res.duration || res.performance?.duration;

      const entry = document.createElement('div');
      entry.style.cssText = `padding: 10px 12px; margin-bottom: 4px; border-radius: 4px; background: ${isError ? '#3d2626' : '#313244'}; border-left: 3px solid ${isError ? '#f38ba8' : statusColor(status)};`;

      const methodBadge = `<span style="color: #1e1e2e; font-weight: 600; font-size: 10px; padding: 1px 5px; border-radius: 3px; background: ${isError ? '#f38ba8' : '#89dceb'};">${method}</span>`;
      const statusBadge = isError
        ? `<span style="color: #f38ba8; font-size: 11px; font-weight: 600;">${detail.error ? detail.error.toUpperCase() + ' ERROR' : 'NETWORK ERROR'}</span>`
        : `<span style="color: ${statusColor(status)}; font-weight: 600;">${status} ${res.statusText || ''}</span>`;
      const durationBadge =
        duration != null
          ? `<span style="color: ${durationColor(Math.round(duration))}; font-size: 11px;">${Math.round(duration)}ms</span>`
          : '';

      let bodyPreview = '';
      const resBody = res.body?.body;
      if (resBody) {
        const preview = resBody.length > 200 ? resBody.substring(0, 200) + '…' : resBody;
        bodyPreview = `<div style="color: #585b70; font-size: 11px; margin-top: 4px; white-space: pre-wrap; max-height: 80px; overflow: hidden;">Response: ${escapeHtml(preview)}</div>`;
      }

      const errorMsg =
        isError && detail.message
          ? `<div style="color: #f38ba8; font-size: 11px; margin-top: 2px;">${escapeHtml(String(detail.message))}</div>`
          : '';

      const protocol = res.nextHopProtocol
        ? `<span style="color: #585b70; font-size: 10px;">${res.nextHopProtocol}</span>`
        : '';

      entry.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="color: #585b70; font-size: 11px;">${formatTime()}</span>
          ${methodBadge}
          <span style="color: #cdd6f4; word-break: break-all;">${escapeHtml(url)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
          ${statusBadge}
          ${durationBadge}
          ${protocol}
        </div>
        ${errorMsg}
        ${bodyPreview}
        <details style="margin-top: 6px;">
          <summary style="color: #585b70; font-size: 11px; cursor: pointer; user-select: none;">Event structure</summary>
          <pre style="margin: 4px 0 0 0; padding: 8px; background: #11111b; border-radius: 4px; overflow-x: auto; font-size: 11px; line-height: 1.4;">${renderStructuredEvent(detail)}</pre>
        </details>
      `;
      eventLog.appendChild(entry);
      eventLog.scrollTop = eventLog.scrollHeight;
    };

    setTimeout(() => {
      ready = true;
    }, 150);

    const toggleBtn = container.querySelector('#btn-toggle') as HTMLButtonElement;

    const startLogger = () => {
      setupLogger((detail) => {
        if (!ready) return;
        if (detail.type === 'network' || detail.type === 'network-error') {
          addEntry(detail);
        }
      });
      updateToggleBtn(toggleBtn, true);
    };

    startLogger();

    toggleBtn.addEventListener('click', () => {
      if (isLoggerActive()) {
        teardownLogger();
        updateToggleBtn(toggleBtn, false);
      } else {
        startLogger();
      }
    });

    container.querySelector('#btn-get')!.addEventListener('click', () => {
      fetch('https://jsonplaceholder.typicode.com/todos/1');
    });
    container.querySelector('#btn-post')!.addEventListener('click', () => {
      fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Logger Demo Post',
          body: 'This request was captured by the logger interceptor.',
          userId: 1,
        }),
      });
    });
    container.querySelector('#btn-404')!.addEventListener('click', () => {
      fetch('/nonexistent-api-endpoint-12345').catch(() => {});
    });
    container.querySelector('#btn-error')!.addEventListener('click', () => {
      fetch('https://this-domain-does-not-exist-12345.example/api').catch(() => {});
    });

    container.querySelector('#btn-clear')!.addEventListener('click', () => {
      eventLog.innerHTML = '<div style="color: #6c7086;">Waiting for network events…</div>';
      eventCount = 0;
      countEl.textContent = '0 requests captured';
    });

    return container;
  },
};
