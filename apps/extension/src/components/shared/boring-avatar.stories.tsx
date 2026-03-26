import type { Meta, StoryObj } from '@storybook/react-vite';

import { AVATAR_SIZES, BoringAvatar } from './boring-avatar';

const meta = {
  title: 'Shared/BoringAvatar',
  component: BoringAvatar,
  args: {
    name: 'John Doe',
    size: AVATAR_SIZES.USER,
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AVATAR_SIZES),
      mapping: AVATAR_SIZES,
    },
  },
} satisfies Meta<typeof BoringAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEmail: Story = {
  args: {
    name: null,
    email: 'jane@example.com',
  },
};

export const NoSeed: Story = {
  args: {
    name: null,
    email: null,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {Object.entries(AVATAR_SIZES).map(([label, size]) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <BoringAvatar name="John Doe" size={size} />
          <span className="text-xs text-muted-foreground">
            {label} ({size}px)
          </span>
        </div>
      ))}
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-2">
      {['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'].map((name) => (
        <BoringAvatar key={name} name={name} size={AVATAR_SIZES.GROUP} className="ring-2 ring-background" />
      ))}
    </div>
  ),
};
