import type { Meta, StoryObj } from '@storybook/html-vite';

import { BlurManager } from '../src';

const meta: Meta = {
  title: 'Blurr/Adaptive Blur',
  parameters: {
    docs: {
      description: {
        component: 'Blurr automatically calculates optimal blur radius based on content size.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const TextSizes: Story = {
  name: 'Text Size Adaptation',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 700px;">
        <h2 style="margin-top: 0;">Adaptive Text Blur</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Blur radius is calculated based on font size: <code>blur = fontSize / 4</code>
        </p>

        <div style="display: grid; gap: 16px;">
          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="font-size: 12px; margin: 0;">12px - Small text gets subtle blur</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="font-size: 16px; margin: 0;">16px - Normal text gets moderate blur</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="font-size: 24px; margin: 0;">24px - Larger text gets more blur</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="font-size: 36px; margin: 0;">36px - Heading gets strong blur</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <p style="font-size: 48px; margin: 0;">48px - Large heading</p>
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

export const MixedContent: Story = {
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 700px;">
        <h2 style="margin-top: 0;">Mixed Content Blur</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Elements with mixed font sizes use the largest size for blur calculation.
        </p>

        <div style="display: grid; gap: 16px;">
          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 24px;">Card Title</h3>
            <p style="font-size: 14px; margin: 0; color: #666;">
              This card has a large title and smaller body text.
              The blur radius is based on the 24px title.
            </p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <span style="font-size: 12px; color: #888;">ACCOUNT NUMBER</span>
            <p style="font-size: 32px; margin: 4px 0 0 0; font-weight: bold;">1234-5678-9012</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 14px;">Balance:</span>
              <span style="font-size: 28px; font-weight: bold;">$12,345.67</span>
            </div>
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

export const CustomOptions: Story = {
  name: 'Custom Blur Options',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 700px;">
        <h2 style="margin-top: 0;">Custom Blur Options</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Configure min/max blur radius and divisors.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <h4 style="margin: 0 0 12px 0;">Default Settings</h4>
            <div id="default-container">
              <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 8px;">
                <p style="font-size: 24px; margin: 0;">Default blur</p>
              </div>
            </div>
            <code style="font-size: 12px; color: #666;">minBlur: 4, maxBlur: 100</code>
          </div>

          <div>
            <h4 style="margin: 0 0 12px 0;">Strong Blur</h4>
            <div id="strong-container">
              <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 8px;">
                <p style="font-size: 24px; margin: 0;">Strong blur</p>
              </div>
            </div>
            <code style="font-size: 12px; color: #666;">minBlur: 10, divisor: 2</code>
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

    const defaultManager = new BlurManager();
    const strongManager = new BlurManager([], {
      minBlurRadius: 10,
      textBlurDivisor: 2,
    });

    const statusEl = container.querySelector('#status') as HTMLElement;
    const toggleBtn = container.querySelector('#toggle-blur') as HTMLButtonElement;

    let isStarted = false;

    const updateStatus = () => {
      statusEl.textContent = isStarted ? 'Blur: ON' : 'Blur: OFF';
      statusEl.style.color = isStarted ? '#22c55e' : '#666';
    };

    toggleBtn.addEventListener('click', () => {
      if (isStarted) {
        defaultManager.stop();
        strongManager.stop();
        isStarted = false;
      } else {
        defaultManager.start();
        strongManager.start();
        isStarted = true;
      }
      updateStatus();
    });

    defaultManager.start();
    strongManager.start();
    isStarted = true;
    updateStatus();

    return container;
  },
};
