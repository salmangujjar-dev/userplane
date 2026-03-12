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

const LEVEL_COLORS: Record<string, string> = {
  log: '#89b4fa',
  info: '#89b4fa',
  warn: '#f9e2af',
  error: '#f38ba8',
  debug: '#a6e3a1',
  trace: '#cba6f7',
};

const LEVEL_BG: Record<string, string> = {
  log: '#313244',
  info: '#313244',
  warn: '#3d3526',
  error: '#3d2626',
  debug: '#263d26',
  trace: '#332644',
};

const btnBase =
  'padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: system-ui, sans-serif; transition: opacity 0.15s;';

const meta: Meta = {
  title: 'Demos/Console Capture',
  parameters: {
    docs: {
      description: {
        component:
          'The logger intercepts all console methods — log, info, warn, error, debug, trace — serializes their arguments, captures stack traces, and batches repeat calls.',
      },
    },
  },
};

export default meta;

export const LiveDemo: StoryObj = {
  name: 'Live Console Capture',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 860px;">
        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">Console Interceptor</h2>
        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
          Click buttons to call real <code>console</code> methods. The logger intercepts each call,
          serializes arguments, and captures the stack trace — all without breaking the original behavior.
        </p>

        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
          <button id="btn-toggle" style=""></button>
          <button id="btn-log" style="${btnBase} border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;">
            console.log
          </button>
          <button id="btn-info" style="${btnBase} border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;">
            console.info
          </button>
          <button id="btn-warn" style="${btnBase} border: 1px solid #fde68a; background: #fffbeb; color: #92400e;">
            console.warn
          </button>
          <button id="btn-error" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            console.error
          </button>
          <button id="btn-object" style="${btnBase} border: 1px solid #c4b5fd; background: #f5f3ff; color: #5b21b6;">
            Log Object
          </button>
          <button id="btn-error-obj" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            Log Error
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
          <button id="btn-clear" style="padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; color: #666;">
            Clear Log
          </button>
          <span id="event-count" style="font-size: 12px; color: #888;">0 events captured</span>
        </div>

        <div id="event-log" style="background: #1e1e2e; border-radius: 8px; padding: 16px; min-height: 260px; max-height: 420px; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 12px; line-height: 1.5;">
          <div style="color: #6c7086;">Waiting for console events…</div>
        </div>
      </div>
    `;

    const eventLog = container.querySelector('#event-log') as HTMLElement;
    const countEl = container.querySelector('#event-count') as HTMLElement;
    let eventCount = 0;
    let ready = false;

    const addEntry = (detail: any) => {
      if (eventCount === 0) eventLog.innerHTML = '';
      eventCount++;
      countEl.textContent = `${eventCount} event${eventCount !== 1 ? 's' : ''} captured`;

      const level = (detail.level || 'log').toLowerCase();
      const color = LEVEL_COLORS[level] || '#cdd6f4';
      const bg = LEVEL_BG[level] || '#313244';
      const args = (detail.args || [])
        .map((a: any) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
        .join(' ');

      const entry = document.createElement('div');
      entry.style.cssText = `padding: 8px 10px; margin-bottom: 4px; border-radius: 4px; background: ${bg}; border-left: 3px solid ${color};`;
      entry.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
          <span style="color: #585b70; font-size: 11px;">${formatTime()}</span>
          <span style="color: ${color}; font-weight: 600; font-size: 10px; text-transform: uppercase; padding: 1px 5px; border-radius: 3px; background: ${color}22;">${level}</span>
          ${detail.repeatCount && detail.repeatCount > 1 ? `<span style="color: #f9e2af; font-size: 10px;">×${detail.repeatCount}</span>` : ''}
        </div>
        <div style="color: #cdd6f4; white-space: pre-wrap; word-break: break-word; margin-bottom: 6px;">${escapeHtml(args)}</div>
        <details style="margin-top: 4px;">
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
        if (ready && detail.type === 'console') addEntry(detail);
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

    // Button handlers
    container.querySelector('#btn-log')!.addEventListener('click', () => {
      console.log('Hello from the Logger demo!', 42, true);
    });
    container.querySelector('#btn-info')!.addEventListener('click', () => {
      console.info('User session started', {
        sessionId: 'abc-123',
        timestamp: Date.now(),
      });
    });
    container.querySelector('#btn-warn')!.addEventListener('click', () => {
      console.warn('API rate limit approaching', {
        remaining: 12,
        limit: 100,
      });
    });
    container.querySelector('#btn-error')!.addEventListener('click', () => {
      console.error('Failed to fetch user data', {
        status: 500,
        endpoint: '/api/users',
      });
    });
    container.querySelector('#btn-object')!.addEventListener('click', () => {
      console.log('Complex object:', {
        user: {
          name: 'Alice',
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
        },
        metadata: {
          lastLogin: new Date().toISOString(),
          ip: '192.168.1.1',
        },
      });
    });
    container.querySelector('#btn-error-obj')!.addEventListener('click', () => {
      const err = new Error('Something went terribly wrong');
      console.error('Caught exception:', err);
    });

    container.querySelector('#btn-clear')!.addEventListener('click', () => {
      eventLog.innerHTML = '<div style="color: #6c7086;">Waiting for console events…</div>';
      eventCount = 0;
      countEl.textContent = '0 events captured';
    });

    return container;
  },
};
