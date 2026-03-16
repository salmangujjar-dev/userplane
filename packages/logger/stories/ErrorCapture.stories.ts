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

const meta: Meta = {
  title: 'Demos/Error Capture',
  parameters: {
    docs: {
      description: {
        component:
          'The logger captures unhandled errors, promise rejections, and CSP violations — providing full stack traces for debugging.',
      },
    },
  },
};

export default meta;

export const LiveDemo: StoryObj = {
  name: 'Live Error Capture',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 860px;">
        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">Error Interceptor</h2>
        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
          The logger intercepts unhandled errors and promise rejections via
          <code>window.onerror</code> and <code>unhandledrejection</code>.
          Errors are captured with full stack traces for debugging.
        </p>

        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
          <button id="btn-toggle" style=""></button>
          <button id="btn-throw" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            Throw Error
          </button>
          <button id="btn-reject" style="${btnBase} border: 1px solid #fde68a; background: #fffbeb; color: #92400e;">
            Unhandled Rejection
          </button>
          <button id="btn-type-error" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            TypeError
          </button>
          <button id="btn-reference" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            ReferenceError
          </button>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #92400e;">
          <strong>Note:</strong> These trigger real browser errors (visible in DevTools console).
          The logger captures them automatically — that's the whole point!
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
          <button id="btn-clear" style="padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; color: #666;">
            Clear Log
          </button>
          <span id="event-count" style="font-size: 12px; color: #888;">0 errors captured</span>
        </div>

        <div id="event-log" style="background: #1e1e2e; border-radius: 8px; padding: 16px; min-height: 260px; max-height: 420px; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 12px; line-height: 1.5;">
          <div style="color: #6c7086;">Waiting for error events…</div>
        </div>
      </div>
    `;

    const eventLog = container.querySelector('#event-log') as HTMLElement;
    const countEl = container.querySelector('#event-count') as HTMLElement;
    let eventCount = 0;
    let ready = false;

    const addEntry = (detail: any) => {
      if (detail.level !== 'error') return;

      if (eventCount === 0) eventLog.innerHTML = '';
      eventCount++;
      countEl.textContent = `${eventCount} error${eventCount !== 1 ? 's' : ''} captured`;

      const args = (detail.args || [])
        .map((a: any) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
        .join(' ');
      // trace is a string[] of stack frames
      const traceLines: string[] = Array.isArray(detail.trace) ? detail.trace.slice(0, 4) : [];
      const traceFirst = traceLines[0] || '';

      const entry = document.createElement('div');
      entry.style.cssText =
        'padding: 10px 12px; margin-bottom: 4px; border-radius: 4px; background: #3d2626; border-left: 3px solid #f38ba8;';
      entry.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="color: #585b70; font-size: 11px;">${formatTime()}</span>
          <span style="color: #f38ba8; font-weight: 600; font-size: 10px; padding: 1px 5px; border-radius: 3px; background: #f38ba822;">ERROR</span>
        </div>
        <div style="color: #f38ba8; white-space: pre-wrap; word-break: break-word; margin-bottom: 4px;">${escapeHtml(args)}</div>
        ${
          traceLines.length > 0
            ? `<div style="color: #585b70; font-size: 11px; border-top: 1px solid #45475a; padding-top: 4px; margin-top: 4px;">
            <div style="color: #6c7086; margin-bottom: 2px;">Stack trace:</div>
            ${traceLines.map((l: string) => `<div style="padding-left: 8px;">↳ ${escapeHtml(l)}</div>`).join('')}
          </div>`
            : traceFirst
              ? `<div style="color: #585b70; font-size: 11px;">↳ ${escapeHtml(traceFirst)}</div>`
              : ''
        }
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
        if (detail.type === 'console' && detail.level === 'error') {
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

    container.querySelector('#btn-throw')!.addEventListener('click', () => {
      setTimeout(() => {
        throw new Error('Demo: unhandled runtime error');
      }, 0);
    });

    container.querySelector('#btn-reject')!.addEventListener('click', () => {
      Promise.reject(new Error('Demo: unhandled promise rejection'));
    });

    container.querySelector('#btn-type-error')!.addEventListener('click', () => {
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (null as any).someMethod();
      }, 0);
    });

    container.querySelector('#btn-reference')!.addEventListener('click', () => {
      setTimeout(() => {
        // Access a property on an undefined variable to trigger ReferenceError
        const fn = new Function('return nonExistentVariable.property');
        fn();
      }, 0);
    });

    container.querySelector('#btn-clear')!.addEventListener('click', () => {
      eventLog.innerHTML = '<div style="color: #6c7086;">Waiting for error events…</div>';
      eventCount = 0;
      countEl.textContent = '0 errors captured';
    });

    return container;
  },
};
