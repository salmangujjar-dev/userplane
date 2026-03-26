import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DinoError } from './dino-error';

const meta = {
  title: 'Shared/DinoError',
  component: DinoError,
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
} satisfies Meta<typeof DinoError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPrimaryAction: Story = {
  args: {
    title: 'Unable to Create Link',
    description: 'The link could not be created due to a server error.',
    primaryAction: { label: 'Try Again', onClick: fn() },
  },
};

export const WithBothActions: Story = {
  args: {
    title: 'Unable to Create Link',
    description: 'An error occurred while creating the link.',
    primaryAction: { label: 'Try Again', onClick: fn() },
    secondaryAction: { label: 'Learn More', onClick: fn() },
  },
};

export const CustomError: Story = {
  args: {
    title: 'Network Error',
    description: 'Could not connect to the server. Check your internet connection and try again.',
    primaryAction: { label: 'Retry', onClick: fn() },
    secondaryAction: { label: 'Go Back', onClick: fn() },
  },
};
