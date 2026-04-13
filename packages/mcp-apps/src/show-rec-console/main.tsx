import '../utils/zod-jitless';
import '../ui/styles.css';

import { ConsoleTab } from '../components/recording/ConsoleTab';
import type { ConsoleLogEntry } from '../components/recording/types';
import { MessageSquareIcon } from '../components/shared/icons';
import { bootstrapFocusedResourceWidget } from '../utils/bootstrap-widget';

bootstrapFocusedResourceWidget<ConsoleLogEntry>({
  appName: 'Userplane Console Logs',
  appVersion: '1.0.0',
  loadingMessage: 'Loading console logs...',
  resourceType: 'consoleLog',
  emptyIcon: MessageSquareIcon,
  emptyTitle: 'No console logs',
  emptyDescription: 'Console log capture was not enabled for this recording.',
  render: (entries, recordingStartTime) => (
    <ConsoleTab data={entries} recordingStartTime={recordingStartTime} />
  ),
});
