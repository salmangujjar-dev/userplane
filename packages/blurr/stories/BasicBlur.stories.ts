import type { Meta, StoryObj } from '@storybook/html';
import { BlurManager } from '../src';

type BlurDemoArgs = {
  autoStart: boolean;
};

const meta: Meta<BlurDemoArgs> = {
  title: 'Blurr/Basic Usage',
  parameters: {
    docs: {
      description: {
        component: 'Basic demonstration of the BlurManager applying blur to sensitive elements.',
      },
    },
  },
  argTypes: {
    autoStart: {
      control: 'boolean',
      description: 'Automatically start blurring on load',
      defaultValue: true,
    },
  },
};

export default meta;

type Story = StoryObj<BlurDemoArgs>;

export const DataAttribute: Story = {
  name: 'Using data-userplane-blur',
  args: {
    autoStart: true,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">Data Attribute Demo</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Elements with <code>data-userplane-blur="true"</code> will be blurred.
        </p>

        <div style="display: grid; gap: 16px;">
          <div style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Public Content</h4>
            <p style="margin: 0; color: #666;">This content is visible to everyone.</p>
          </div>

          <div data-userplane-blur="true" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Sensitive Content</h4>
            <p style="margin: 0; color: #666;">SSN: 123-45-6789</p>
            <p style="margin: 0; color: #666;">Credit Card: 4111-1111-1111-1111</p>
          </div>

          <div style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">More Public Content</h4>
            <p style="margin: 0; color: #666;">This is also visible.</p>
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

    if (args.autoStart) {
      blurManager.start();
    }
    updateStatus();

    return container;
  },
};

export const CSSClass: Story = {
  name: 'Using CSS Classes',
  args: {
    autoStart: true,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="margin-top: 0;">CSS Class Demo</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Elements with <code>.userplane-mask</code> class will be blurred.
        </p>

        <div style="display: grid; gap: 16px;">
          <div style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0;">User Profile</h4>
            <p style="margin: 0;">Name: John Doe</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <h4 style="margin: 0 0 8px 0;">Contact Info (Sensitive)</h4>
            <p style="margin: 0;">Email: john.doe@example.com</p>
            <p style="margin: 0;">Phone: (555) 123-4567</p>
          </div>

          <div class="userplane-mask" style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff8f8;">
            <h4 style="margin: 0 0 8px 0;">Payment Info (Sensitive)</h4>
            <p style="margin: 0;">Card: **** **** **** 4242</p>
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

    if (args.autoStart) {
      blurManager.start();
    }
    updateStatus();

    return container;
  },
};

export const FormInputs: Story = {
  name: 'Form Inputs',
  args: {
    autoStart: true,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 500px;">
        <h2 style="margin-top: 0;">Form Input Protection</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Protect sensitive form fields during screen recording.
        </p>

        <form style="display: grid; gap: 16px;">
          <div>
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Username</label>
            <input type="text" value="johndoe" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" />
          </div>

          <div class="userplane-mask">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Password</label>
            <input type="password" value="secretpassword123" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" />
          </div>

          <div class="userplane-mask">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Credit Card</label>
            <input type="text" value="4111 1111 1111 1111" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" />
          </div>

          <div class="userplane-mask">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">CVV</label>
            <input type="text" value="123" style="width: 100px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" />
          </div>
        </form>

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

    if (args.autoStart) {
      blurManager.start();
    }
    updateStatus();

    return container;
  },
};
