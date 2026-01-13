import type { Meta, StoryObj } from '@storybook/html';
import { BlurManager } from '../src';

const meta: Meta = {
  title: 'Blurr/Dynamic Content',
  parameters: {
    docs: {
      description: {
        component: 'Blurr automatically blurs dynamically added content using MutationObserver.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const DynamicElements: Story = {
  name: 'Dynamic Element Addition',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">Dynamic Content Blurring</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Elements added after BlurManager starts are automatically blurred.
        </p>

        <div id="content-area" style="min-height: 200px; border: 2px dashed #e0e0e0; border-radius: 8px; padding: 16px;">
          <p style="color: #999; text-align: center;">Click "Add Content" to add sensitive elements</p>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="add-content" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #f0f9ff;">
            Add Sensitive Content
          </button>
          <button id="add-public" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Add Public Content
          </button>
          <button id="clear-content" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Clear
          </button>
          <button id="toggle-blur" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Toggle Blur
          </button>
          <span id="status" style="padding: 8px; color: #666;"></span>
        </div>
      </div>
    `;

    const blurManager = new BlurManager();
    const contentArea = container.querySelector('#content-area') as HTMLElement;
    const statusEl = container.querySelector('#status') as HTMLElement;
    const addBtn = container.querySelector('#add-content') as HTMLButtonElement;
    const addPublicBtn = container.querySelector('#add-public') as HTMLButtonElement;
    const clearBtn = container.querySelector('#clear-content') as HTMLButtonElement;
    const toggleBtn = container.querySelector('#toggle-blur') as HTMLButtonElement;

    let counter = 0;

    const updateStatus = () => {
      statusEl.textContent = blurManager.isStarted ? 'Blur: ON' : 'Blur: OFF';
      statusEl.style.color = blurManager.isStarted ? '#22c55e' : '#666';
    };

    addBtn.addEventListener('click', () => {
      counter++;
      const el = document.createElement('div');
      el.className = 'userplane-mask';
      el.style.cssText =
        'padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 8px; background: #fff8f8;';
      el.innerHTML = `
        <strong>Sensitive Item #${counter}</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px;">SSN: ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 9000 + 1000)}</p>
      `;
      contentArea.appendChild(el);
    });

    addPublicBtn.addEventListener('click', () => {
      counter++;
      const el = document.createElement('div');
      el.style.cssText =
        'padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 8px; background: #f0fff4;';
      el.innerHTML = `
        <strong>Public Item #${counter}</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px;">This content is not marked as sensitive.</p>
      `;
      contentArea.appendChild(el);
    });

    clearBtn.addEventListener('click', () => {
      contentArea.innerHTML =
        '<p style="color: #999; text-align: center;">Click "Add Content" to add sensitive elements</p>';
      counter = 0;
    });

    toggleBtn.addEventListener('click', () => {
      if (blurManager.isStarted) {
        blurManager.stop();
      } else {
        blurManager.start();
      }
      updateStatus();
    });

    blurManager.start();
    updateStatus();

    return container;
  },
};

export const CustomSelectors: Story = {
  name: 'Dynamic Custom Selectors',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">Dynamic Custom Selectors</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Add custom selectors at runtime to blur additional elements.
        </p>

        <div style="display: grid; gap: 16px; margin-bottom: 20px;">
          <div class="user-email" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <code style="font-size: 12px; color: #888;">.user-email</code>
            <p style="margin: 8px 0 0 0;">user@example.com</p>
          </div>

          <div class="user-phone" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <code style="font-size: 12px; color: #888;">.user-phone</code>
            <p style="margin: 8px 0 0 0;">(555) 123-4567</p>
          </div>

          <div class="user-address" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <code style="font-size: 12px; color: #888;">.user-address</code>
            <p style="margin: 8px 0 0 0;">123 Main St, Anytown, USA</p>
          </div>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="add-email" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Blur .user-email
          </button>
          <button id="add-phone" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Blur .user-phone
          </button>
          <button id="add-address" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Blur .user-address
          </button>
        </div>

        <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
          <strong>Active selectors:</strong>
          <code id="active-selectors" style="display: block; margin-top: 4px; font-size: 12px;">(none)</code>
        </div>
      </div>
    `;

    const blurManager = new BlurManager();
    const activeSelectorsEl = container.querySelector('#active-selectors') as HTMLElement;

    const updateSelectors = () => {
      const selectors = blurManager.customSelectors;
      activeSelectorsEl.textContent = selectors.length > 0 ? selectors.join(', ') : '(none)';
    };

    container.querySelector('#add-email')?.addEventListener('click', () => {
      blurManager.addCustomSelectors(['.user-email']);
      updateSelectors();
    });

    container.querySelector('#add-phone')?.addEventListener('click', () => {
      blurManager.addCustomSelectors(['.user-phone']);
      updateSelectors();
    });

    container.querySelector('#add-address')?.addEventListener('click', () => {
      blurManager.addCustomSelectors(['.user-address']);
      updateSelectors();
    });

    blurManager.start();
    updateSelectors();

    return container;
  },
};

export const Events: Story = {
  name: 'Blur Events',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">Blur Events</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Listen to blur events for analytics or debugging.
        </p>

        <div style="display: grid; gap: 16px; margin-bottom: 20px;">
          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <p style="margin: 0;">Sensitive content #1</p>
          </div>
          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <p style="margin: 0;">Sensitive content #2</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <strong>Event Log:</strong>
          <div id="event-log" style="margin-top: 8px; padding: 12px; background: #1a1a1a; color: #00ff00; border-radius: 8px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">
            <div>Waiting for events...</div>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="toggle-blur" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Toggle Blur
          </button>
          <button id="clear-log" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Clear Log
          </button>
        </div>
      </div>
    `;

    const blurManager = new BlurManager();
    const eventLog = container.querySelector('#event-log') as HTMLElement;
    const toggleBtn = container.querySelector('#toggle-blur') as HTMLButtonElement;
    const clearBtn = container.querySelector('#clear-log') as HTMLButtonElement;

    const log = (message: string) => {
      const time = new Date().toLocaleTimeString();
      const line = document.createElement('div');
      line.textContent = `[${time}] ${message}`;
      eventLog.appendChild(line);
      eventLog.scrollTop = eventLog.scrollHeight;
    };

    blurManager.on('start', () => log('EVENT: start'));
    blurManager.on('stop', () => log('EVENT: stop'));
    blurManager.on('blur', (data: any) => log(`EVENT: blur (radius: ${data?.blurRadius}px)`));
    blurManager.on('unblur', () => log('EVENT: unblur'));

    toggleBtn.addEventListener('click', () => {
      if (blurManager.isStarted) {
        blurManager.stop();
      } else {
        blurManager.start();
      }
    });

    clearBtn.addEventListener('click', () => {
      eventLog.innerHTML = '<div>Log cleared...</div>';
    });

    eventLog.innerHTML = '';
    log('BlurManager initialized');
    blurManager.start();

    return container;
  },
};
