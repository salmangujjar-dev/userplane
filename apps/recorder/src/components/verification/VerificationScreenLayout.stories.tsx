import type { Meta, StoryObj } from '@storybook/react';

import VerificationScreenLayout from './VerificationScreenLayout';

const meta = {
  title: 'Verification/VerificationScreenLayout',
  component: VerificationScreenLayout,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof VerificationScreenLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Content goes here</h1>
        <p className="text-gray-600">
          This is the verification screen layout with default branding.
        </p>
      </div>
    ),
  },
};

export const WithCustomBranding: Story = {
  args: {
    workspaceName: 'Acme Inc.',
    workspaceLogoUrl: '/logo-dark.svg',
    footnoteText: 'Powered by Userplane',
    children: (
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Custom Branding</h1>
        <p className="text-gray-600">This layout uses custom workspace branding.</p>
      </div>
    ),
  },
};
