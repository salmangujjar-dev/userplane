'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';

import { useSubscriptionStatus } from '@/features/billing';
import {
  useActionLogData,
  useConsoleLogData,
  useNetworkLogData,
  useRecordingAction,
  useRecordingConsoleLog,
  useRecordingNetworkLog,
} from '@/features/recordings';
import { useWorkspaceId } from '@/stores/workspace';
import type { RecordingDetail } from '@/types';

import { ActionsPanel } from './actions-panel';
// TODO: Add backend integration (Sentry / Datadog / Logrocket etc.)
// import { BackendPanel } from './backend-panel';
import { CaptureGateOverlay } from './capture-gate-overlay';
import { ConsolePanel } from './console-panel';
import { InfoPanel } from './info-panel';
import { NetworkPanel } from './network-panel';
import { usePanelTab } from './recording-layout';

interface CaptureResource {
  url: string | null;
  captureEnabled?: boolean;
}

interface RecordingLogReplayPanelProps {
  recordingId: string;
  recording: RecordingDetail;
  resources?: {
    consoleLog: CaptureResource;
    networkLog: CaptureResource;
    action: CaptureResource;
  };
}

export function RecordingLogReplayPanel({
  recordingId,
  recording,
  resources: sharedResources,
}: RecordingLogReplayPanelProps) {
  const workspaceId = useWorkspaceId();

  // Fetch subscription status for feature gate checks (only available on workspace page)
  const { data: subscriptionResult } = useSubscriptionStatus();
  const featureGates = subscriptionResult?.success ? subscriptionResult.data.featureGates : null;

  // Fetch resource metadata (disabled when workspaceId is null, i.e. shared page)
  const consoleLogResource = useRecordingConsoleLog(workspaceId, recordingId);
  const networkLogResource = useRecordingNetworkLog(workspaceId, recordingId);
  const actionResource = useRecordingAction(workspaceId, recordingId);

  // Resolve resource: prefer shared page props over workspace hook results
  const consoleLog: CaptureResource | undefined = sharedResources
    ? sharedResources.consoleLog
    : consoleLogResource.data?.success
      ? consoleLogResource.data.data.resource
      : undefined;

  const networkLog: CaptureResource | undefined = sharedResources
    ? sharedResources.networkLog
    : networkLogResource.data?.success
      ? networkLogResource.data.data.resource
      : undefined;

  const action: CaptureResource | undefined = sharedResources
    ? sharedResources.action
    : actionResource.data?.success
      ? actionResource.data.data.resource
      : undefined;

  // Fetch actual log data from presigned URLs
  const consoleLogData = useConsoleLogData(
    workspaceId ?? recordingId,
    recordingId,
    consoleLog?.url ?? undefined
  );
  const networkLogData = useNetworkLogData(
    workspaceId ?? recordingId,
    recordingId,
    networkLog?.url ?? undefined
  );
  const actionLogData = useActionLogData(
    workspaceId ?? recordingId,
    recordingId,
    action?.url ?? undefined
  );

  // Overlay reason per resource:
  //   feature gate OFF → 'feature-gated' (plan limitation → upsell)
  //   feature gate ON  → 'preference-disabled' (user choice → helpdesk link)
  const getOverlayReason = (featureGateEnabled: boolean | undefined) =>
    featureGateEnabled ? ('preference-disabled' as const) : ('feature-gated' as const);

  // Derive the recording start time for log timestamp alignment.
  // Prefer the explicit recordingStartedAt stored during upload.
  // Fall back to createdAt - durationMs for older recordings (approximate).
  const recordingStartTime = recording.recordingStartedAt
    ? new Date(recording.recordingStartedAt).getTime()
    : recording.meta.createdAt
      ? new Date(recording.meta.createdAt).getTime() - recording.recordingDurationMs
      : undefined;

  // Branching per resource:
  //   URL exists           → render data (it was captured, regardless of current preference)
  //   URL null, pref OFF   → show overlay (preference disabled → upsell or helpdesk)
  //   URL null, pref ON    → show empty state (was enabled but nothing captured)
  //   resource not loaded  → show loading

  const tabTriggerClassName =
    'rounded-none border-0 bg-transparent px-0 pb-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground';

  const panelTab = usePanelTab();

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <Tabs
        {...(panelTab
          ? { value: panelTab.activeTab, onValueChange: panelTab.setActiveTab }
          : { defaultValue: 'info' })}
        className="flex flex-col h-full"
      >
        <div className="border-b px-6 pt-3">
          <TabsList className="w-full justify-center bg-transparent p-0 h-auto gap-6 border-0">
            <TabsTrigger value="info" className={tabTriggerClassName}>
              Info
            </TabsTrigger>
            <TabsTrigger value="console" className={tabTriggerClassName}>
              Console
            </TabsTrigger>
            <TabsTrigger value="network" className={tabTriggerClassName}>
              Network
            </TabsTrigger>
            <TabsTrigger value="actions" className={tabTriggerClassName}>
              Actions
            </TabsTrigger>
            {/* TODO: Add backend integration (Sentry / Datadog / Logrocket etc.)
            <TabsTrigger value="backend" className={tabTriggerClassName}>
              Backend
            </TabsTrigger>
            */}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="info" className="h-full mt-0 p-0">
            <InfoPanel recording={recording} />
          </TabsContent>

          <TabsContent value="console" className="h-full mt-0 p-0">
            {consoleLog?.url != null ? (
              <ConsolePanel
                data={consoleLogData.data}
                isLoading={consoleLogData.isLoading}
                recordingStartTime={recordingStartTime}
              />
            ) : consoleLog && !consoleLog.captureEnabled ? (
              <CaptureGateOverlay
                title="Console Logs"
                subtitle="View browser console logs, errors, and debug messages captured during the session."
                reason={getOverlayReason(featureGates?.captureConsoleLog)}
                featureGateKey="captureConsoleLog"
              >
                <ConsolePanel />
              </CaptureGateOverlay>
            ) : consoleLog ? (
              <ConsolePanel data={[]} recordingStartTime={recordingStartTime} />
            ) : (
              <ConsolePanel isLoading />
            )}
          </TabsContent>

          <TabsContent value="network" className="h-full mt-0 p-0">
            {networkLog?.url != null ? (
              <NetworkPanel
                data={networkLogData.data}
                isLoading={networkLogData.isLoading}
                recordingStartTime={recordingStartTime}
              />
            ) : networkLog && !networkLog.captureEnabled ? (
              <CaptureGateOverlay
                title="Network Activity"
                subtitle="Inspect HTTP requests, responses, and API calls made during the recording."
                reason={getOverlayReason(featureGates?.captureNetworkActivity)}
                featureGateKey="captureNetworkActivity"
              >
                <NetworkPanel />
              </CaptureGateOverlay>
            ) : networkLog ? (
              <NetworkPanel data={[]} recordingStartTime={recordingStartTime} />
            ) : (
              <NetworkPanel isLoading />
            )}
          </TabsContent>

          <TabsContent value="actions" className="h-full mt-0 p-0">
            {action?.url != null ? (
              <ActionsPanel
                data={actionLogData.data}
                isLoading={actionLogData.isLoading}
                recordingStartTime={recordingStartTime}
              />
            ) : action && !action.captureEnabled ? (
              <CaptureGateOverlay
                title="User Actions"
                subtitle="Track clicks, inputs, and interactions to understand user behavior."
                reason={getOverlayReason(featureGates?.captureUserActions)}
                featureGateKey="captureUserActions"
              >
                <ActionsPanel />
              </CaptureGateOverlay>
            ) : action ? (
              <ActionsPanel data={[]} recordingStartTime={recordingStartTime} />
            ) : (
              <ActionsPanel isLoading />
            )}
          </TabsContent>

          {/* TODO: Add backend integration (Sentry / Datadog / Logrocket etc.)
          <TabsContent value="backend" className="h-full mt-0 p-0">
            <CaptureGateOverlay
              title="Backend Logs"
              subtitle="Correlate frontend sessions with server-side logs and traces."
              reason="preference-disabled"
            >
              <BackendPanel />
            </CaptureGateOverlay>
          </TabsContent>
          */}
        </div>
      </Tabs>
    </div>
  );
}
