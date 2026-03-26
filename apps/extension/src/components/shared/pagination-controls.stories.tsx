import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PaginationControls } from './pagination-controls';

const meta = {
  title: 'Shared/PaginationControls',
  component: PaginationControls,
  args: {
    currentPage: 1,
    totalPages: 10,
    onPageChange: fn(),
  },
} satisfies Meta<typeof PaginationControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MiddlePage: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
  },
};

export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
  },
};

export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
  },
};

export const ManyPages: Story = {
  args: {
    currentPage: 1,
    totalPages: 50,
  },
};
