import type { Meta, StoryObj } from '@storybook/html';
import { BlurManager, getSelectorStats } from '../src';

const meta: Meta = {
  title: 'Blurr/Provider Compatibility',
  parameters: {
    docs: {
      description: {
        component: 'Blurr is compatible with 40+ third-party analytics and session replay tools.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const ProviderSelectors: Story = {
  name: 'Supported Providers',
  render: () => {
    const stats = getSelectorStats();
    const container = document.createElement('div');

    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 800px;">
        <h2 style="margin-top: 0;">Provider Compatibility</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Blurr automatically recognizes privacy selectors from ${stats.totalProviders} providers.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">
          ${stats.maskProviders
            .map(
              (provider) => `
            <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9;">
              <span style="font-weight: 500;">${provider}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div style="padding: 16px; background: #f0f9ff; border-radius: 8px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0;">Stats</h4>
          <p style="margin: 0;">Total mask selectors: <strong>${stats.totalMaskSelectors}</strong></p>
          <p style="margin: 0;">Total unmask selectors: <strong>${stats.totalUnmaskSelectors}</strong></p>
        </div>
      </div>
    `;

    return container;
  },
};

export const FullStory: Story = {
  name: 'FullStory Selectors',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">FullStory Compatibility</h2>
        <p style="color: #666; margin-bottom: 20px;">
          If you already use FullStory privacy classes, Blurr will respect them.
        </p>

        <div style="display: grid; gap: 16px;">
          <div class="fs-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">.fs-mask</code>
            <p style="margin: 8px 0 0 0;">This content uses FullStory's mask class.</p>
          </div>

          <div class="fs-exclude" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">.fs-exclude</code>
            <p style="margin: 8px 0 0 0;">This content uses FullStory's exclude class.</p>
          </div>

          <div class="fs-block" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">.fs-block</code>
            <p style="margin: 8px 0 0 0;">This content uses FullStory's block class.</p>
          </div>

          <div class="fs-unmask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f0fff4;">
            <code style="font-size: 12px; color: #888;">.fs-unmask</code>
            <p style="margin: 8px 0 0 0;">This content is explicitly unmasked.</p>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button id="toggle-blur" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Toggle Blur
          </button>
          <span id="status" style="padding: 8px; color: #666;"></span>
        </div>
      </div>
    `;

    const blurManager = new BlurManager();
    const statusEl = container.querySelector('#status') as HTMLElement;
    const toggleBtn = container.querySelector('#toggle-blur') as HTMLButtonElement;

    const updateStatus = () => {
      statusEl.textContent = blurManager.isStarted ? 'Blur: ON' : 'Blur: OFF';
      statusEl.style.color = blurManager.isStarted ? '#22c55e' : '#666';
    };

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

export const Hotjar: Story = {
  name: 'Hotjar Selectors',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">Hotjar Compatibility</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Hotjar privacy attributes are automatically recognized.
        </p>

        <div style="display: grid; gap: 16px;">
          <div data-hj-suppress style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">data-hj-suppress</code>
            <p style="margin: 8px 0 0 0;">This content uses Hotjar's suppress attribute.</p>
          </div>

          <div data-hj-masked style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">data-hj-masked</code>
            <p style="margin: 8px 0 0 0;">This content uses Hotjar's masked attribute.</p>
          </div>

          <div class="hj-suppress" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">.hj-suppress</code>
            <p style="margin: 8px 0 0 0;">This content uses Hotjar's suppress class.</p>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button id="toggle-blur" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Toggle Blur
          </button>
          <span id="status" style="padding: 8px; color: #666;"></span>
        </div>
      </div>
    `;

    const blurManager = new BlurManager();
    const statusEl = container.querySelector('#status') as HTMLElement;
    const toggleBtn = container.querySelector('#toggle-blur') as HTMLButtonElement;

    const updateStatus = () => {
      statusEl.textContent = blurManager.isStarted ? 'Blur: ON' : 'Blur: OFF';
      statusEl.style.color = blurManager.isStarted ? '#22c55e' : '#666';
    };

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

export const Sentry: Story = {
  name: 'Sentry Selectors',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">Sentry Compatibility</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Sentry session replay privacy selectors work out of the box.
        </p>

        <div style="display: grid; gap: 16px;">
          <div class="sentry-block" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">.sentry-block</code>
            <p style="margin: 8px 0 0 0;">This content uses Sentry's block class.</p>
          </div>

          <div data-sentry-mask style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">data-sentry-mask</code>
            <p style="margin: 8px 0 0 0;">This content uses Sentry's mask attribute.</p>
          </div>

          <div data-sentry-block style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <code style="font-size: 12px; color: #888;">data-sentry-block</code>
            <p style="margin: 8px 0 0 0;">This content uses Sentry's block attribute.</p>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button id="toggle-blur" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
            Toggle Blur
          </button>
          <span id="status" style="padding: 8px; color: #666;"></span>
        </div>
      </div>
    `;

    const blurManager = new BlurManager();
    const statusEl = container.querySelector('#status') as HTMLElement;
    const toggleBtn = container.querySelector('#toggle-blur') as HTMLButtonElement;

    const updateStatus = () => {
      statusEl.textContent = blurManager.isStarted ? 'Blur: ON' : 'Blur: OFF';
      statusEl.style.color = blurManager.isStarted ? '#22c55e' : '#666';
    };

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
