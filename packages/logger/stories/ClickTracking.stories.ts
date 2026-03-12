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

const meta: Meta = {
  title: 'Demos/Click Tracking',
  parameters: {
    docs: {
      description: {
        component:
          'The logger tracks clicks and pointer events, capturing element info, coordinates, and CSS selector paths with 120ms debouncing.',
      },
    },
  },
};

export default meta;

export const LiveDemo: StoryObj = {
  name: 'Live Click Tracking',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 860px;">
        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">Click Interceptor</h2>
        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
          Click anywhere in the interactive area below. The logger captures every click with
          element metadata, coordinates, and applies 120ms debouncing to filter duplicates.
        </p>

        <div id="click-area" style="border: 2px dashed #d1d5db; border-radius: 12px; padding: 24px; margin-bottom: 16px; background: #fafafa; user-select: none;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
            <button id="primary-btn" class="primary large" style="padding: 12px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; color: #1d4ed8; cursor: pointer; font-size: 14px;">
              Primary Button
            </button>
            <button id="danger-btn" class="danger" style="padding: 12px; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2; color: #991b1b; cursor: pointer; font-size: 14px;">
              Danger Button
            </button>
            <button class="outline" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: #374151; cursor: pointer; font-size: 14px;">
              Outline Button
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
            <div id="card-1" class="card interactive" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer;">
              <strong style="font-size: 14px;">Card Component</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Click this card to see element capture</p>
            </div>
            <a id="demo-link" class="nav-link" href="#" onclick="event.preventDefault()" style="display: flex; align-items: center; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: #2563eb; text-decoration: none; cursor: pointer;">
              <span style="font-size: 14px;">Anchor Link →</span>
            </a>
          </div>

          <div style="display: flex; gap: 12px;">
            <input id="text-input" type="text" placeholder="Click this input" style="flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;" />
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: #374151;">
              <input type="checkbox" id="check-box" style="width: 16px; height: 16px;" />
              Checkbox
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
          <button id="btn-toggle" style=""></button>
          <button id="btn-clear" style="padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; color: #666;">
            Clear Log
          </button>
          <span id="event-count" style="font-size: 12px; color: #888;">0 clicks captured</span>
        </div>

        <div id="event-log" style="background: #1e1e2e; border-radius: 8px; padding: 16px; min-height: 200px; max-height: 350px; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 12px; line-height: 1.5;">
          <div style="color: #6c7086;">Click any element above to see it captured…</div>
        </div>
      </div>
    `;

    const eventLog = container.querySelector('#event-log') as HTMLElement;
    const countEl = container.querySelector('#event-count') as HTMLElement;
    let eventCount = 0;
    let ready = false;

    const addEntry = (detail: any) => {
      const data = detail.data || {};
      if (data.action !== 'click') return;

      if (eventCount === 0) eventLog.innerHTML = '';
      eventCount++;
      countEl.textContent = `${eventCount} click${eventCount !== 1 ? 's' : ''} captured`;

      // Element info is in data.info (tagName, id, classList)
      const info = data.info || {};
      const tag = info.tagName || '?';
      const id = info.id ? `#${info.id}` : '';
      const classes = info.classList?.length ? `.${info.classList.join('.')}` : '';
      const selector = `${tag}${id}${classes}`;
      const url = data.url || '';

      const entry = document.createElement('div');
      entry.style.cssText =
        'padding: 8px 10px; margin-bottom: 4px; border-radius: 4px; background: #313244; border-left: 3px solid #fab387;';
      entry.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="color: #585b70; font-size: 11px;">${formatTime()}</span>
          <span style="color: #1e1e2e; font-weight: 600; font-size: 10px; padding: 1px 5px; border-radius: 3px; background: #fab387;">CLICK</span>
          <span style="color: #fab387; font-weight: 500;">${escapeHtml(selector)}</span>
          ${url ? `<span style="color: #585b70; font-size: 11px; overflow: hidden; text-overflow: ellipsis; max-width: 300px; white-space: nowrap;">${escapeHtml(url)}</span>` : ''}
        </div>
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
        if (detail.type === 'user-action') addEntry(detail);
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

    container.querySelector('#btn-clear')!.addEventListener('click', () => {
      eventLog.innerHTML =
        '<div style="color: #6c7086;">Click any element above to see it captured…</div>';
      eventCount = 0;
      countEl.textContent = '0 clicks captured';
    });

    return container;
  },
};
