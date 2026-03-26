import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { LinkReferenceInput } from './link-reference-input';

const meta = {
  title: 'Shared/LinkReferenceInput',
  component: LinkReferenceInput,
  parameters: {
    layout: 'centered',
  },
  args: {
    value: '',
    onChange: fn(),
    placeholder: 'Enter URL or reference',
  },
} satisfies Meta<typeof LinkReferenceInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithUrl: Story = {
  args: {
    value: 'https://github.com/org/repo/issues/42',
  },
};

export const WithText: Story = {
  args: {
    value: 'JIRA-456',
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'e.g. https://github.com/org/repo/issues/123, JIRA-456, Customer ABC',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Link Reference</label>
        <LinkReferenceInput
          value={value}
          onChange={setValue}
          placeholder="e.g. https://github.com/org/repo/issues/123"
        />
        <p className="text-xs text-muted-foreground">Current value: {value || '(empty)'}</p>
      </div>
    );
  },
};
