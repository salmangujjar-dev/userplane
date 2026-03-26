import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  FormFieldSkeleton,
  LinkPreviewSkeleton,
  RecordingPreviewSkeleton,
  WorkspaceSwitcherSkeleton,
} from './skeletons';

const meta = {
  title: 'Shared/Skeletons',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

export const LinkPreviewSkeletonStory: StoryObj = {
  name: 'LinkPreview Skeleton',
  render: () => (
    <div className="w-[360px] space-y-4">
      <LinkPreviewSkeleton />
      <LinkPreviewSkeleton />
      <LinkPreviewSkeleton />
    </div>
  ),
};

export const RecordingPreviewSkeletonStory: StoryObj = {
  name: 'RecordingPreview Skeleton',
  render: () => (
    <div className="w-[360px] space-y-2">
      <RecordingPreviewSkeleton />
      <RecordingPreviewSkeleton />
    </div>
  ),
};

export const WorkspaceSwitcherSkeletonStory: StoryObj = {
  name: 'WorkspaceSwitcher Skeleton',
  render: () => (
    <div className="w-[320px]">
      <WorkspaceSwitcherSkeleton />
    </div>
  ),
};

export const FormFieldSkeletonStory: StoryObj = {
  name: 'FormField Skeleton',
  render: () => (
    <div className="w-[320px] space-y-4">
      <FormFieldSkeleton />
      <FormFieldSkeleton />
    </div>
  ),
};
