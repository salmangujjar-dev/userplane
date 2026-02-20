import type { Meta, StoryObj } from '@storybook/react-vite';

import RecordingScreenLayout from './RecordingScreenLayout';

const meta: Meta<typeof RecordingScreenLayout> = {
  title: 'Components/RecordingScreenLayout',
  component: RecordingScreenLayout,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RecordingScreenLayout>;

/**
 * Default layout with Userplane branding
 */
export const Default: Story = {
  args: {
    children: (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Content Area</h1>
        <p className="text-gray-600">This is where screen content goes</p>
      </div>
    ),
  },
};

/**
 * Layout with custom workspace logo
 */
export const WithCustomLogo: Story = {
  args: {
    workspaceLogoUrl: 'https://placehold.co/120x40/2563eb/white?text=ACME',
    workspaceName: 'Acme Corp',
    children: (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Custom Branding</h1>
        <p className="text-gray-600">Notice the custom logo in the footer</p>
      </div>
    ),
  },
};

/**
 * Layout with footnote text
 */
export const WithFootnote: Story = {
  args: {
    workspaceName: 'TechCorp',
    footnoteText: 'Your recording is encrypted and secure',
    children: (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">With Footnote</h1>
        <p className="text-gray-600">Check the footer for the footnote text</p>
      </div>
    ),
  },
};

/**
 * Layout with all custom branding options
 */
export const FullyCustomized: Story = {
  args: {
    workspaceLogoUrl: 'https://placehold.co/120x40/7c3aed/white?text=StartupXYZ',
    workspaceName: 'StartupXYZ',
    footnoteText: 'Powered by StartupXYZ - Recording and feedback made easy',
    children: (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Fully Customized</h1>
        <p className="text-gray-600 mb-4">Custom logo, name, and footnote</p>
        <button className="px-6 py-2 bg-purple-600 text-white rounded-lg">Sample Button</button>
      </div>
    ),
  },
};

/**
 * Layout with long content to test scrolling
 */
export const LongContent: Story = {
  args: {
    children: (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Long Content Test</h1>
        {Array.from({ length: 10 }).map((_, i) => (
          <p key={i} className="text-gray-600 mb-4">
            Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    ),
  },
};

/**
 * Layout with form content
 */
export const WithFormContent: Story = {
  args: {
    workspaceName: 'FormBuilder',
    children: (
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Sample Form</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter your name"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter your email"
              />
            </label>
          </div>
          <button className="w-full py-2 bg-gray-900 text-white rounded-lg">Submit</button>
        </div>
      </div>
    ),
  },
};

/**
 * Layout showing decorative icons on desktop
 */
export const DesktopWithDecorations: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    workspaceName: 'DesignStudio',
    footnoteText: 'Notice the decorative icons on both sides',
    children: (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Desktop View</h1>
        <p className="text-gray-600">On larger screens, decorative icons appear on both sides</p>
      </div>
    ),
  },
};
