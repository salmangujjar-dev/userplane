import '../utils/zod-jitless';
import '../ui/styles.css';

import { NetworkTab } from '../components/recording/NetworkTab';
import type { NetworkLogEntry } from '../components/recording/types';
import { GlobeIcon } from '../components/shared/icons';
import { bootstrapFocusedResourceWidget } from '../utils/bootstrap-widget';

bootstrapFocusedResourceWidget<NetworkLogEntry>({
  appName: 'Userplane Network Requests',
  appVersion: '1.0.0',
  loadingMessage: 'Loading network requests...',
  resourceType: 'networkLog',
  emptyIcon: GlobeIcon,
  emptyTitle: 'No network activity',
  emptyDescription: 'Network log capture was not enabled for this recording.',
  render: (entries, recordingStartTime) => (
    <NetworkTab data={entries} recordingStartTime={recordingStartTime} />
  ),
});
