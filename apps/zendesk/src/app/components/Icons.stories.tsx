import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorIcon, RecordingIcon, RecordingsListIcon, SuccessIcon, UserplaneIcon } from './Icons';

const icons = [
  { name: 'UserplaneIcon', Component: UserplaneIcon },
  { name: 'SuccessIcon', Component: SuccessIcon },
  { name: 'ErrorIcon', Component: ErrorIcon },
  { name: 'RecordingIcon', Component: RecordingIcon },
  { name: 'RecordingsListIcon', Component: RecordingsListIcon },
];

function IconShowcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {icons.map(({ name, Component }) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '120px', fontSize: '13px', color: '#2f3941' }}>{name}</div>
          <Component size={24} />
          <Component size={40} />
        </div>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Components/Icons',
};

export default meta;
type Story = StoryObj;

export const AllIcons: Story = {
  render: () => <IconShowcase />,
};
