import '../utils/zod-jitless';
import '../ui/styles.css';

import { ActionsTab } from '../components/recording/ActionsTab';
import type { ActionLogEntry } from '../components/recording/types';
import { MousePointer2Icon } from '../components/shared/icons';
import { bootstrapFocusedResourceWidget } from '../utils/bootstrap-widget';

bootstrapFocusedResourceWidget<ActionLogEntry>({
  appName: 'Userplane User Actions',
  appVersion: '1.0.0',
  loadingMessage: 'Loading user actions...',
  resourceType: 'action',
  emptyIcon: MousePointer2Icon,
  emptyTitle: 'No user actions',
  emptyDescription: 'Action capture was not enabled for this recording.',
  render: (entries, recordingStartTime) => (
    <ActionsTab data={entries} recordingStartTime={recordingStartTime} />
  ),
});
