import { useCallback, useRef, useState } from 'react';

import { LoadingState, Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/components';
import { ActionsTab } from './ActionsTab';
import { ConsoleTab } from './ConsoleTab';
import { InfoTab } from './InfoTab';
import { NetworkTab } from './NetworkTab';
import type {
  ActionLogEntry,
  ConsoleLogEntry,
  NetworkLogEntry,
  RecordingDetail,
  RecordingResources,
} from './types';

interface RecordingTabsProps {
  recording: RecordingDetail;
  resources: RecordingResources;
}

/**
 * Derive the recording start time for log timestamp alignment.
 * Prefer the explicit recordingStartedAt stored during upload.
 * Fall back to createdAt - durationMs for older recordings (approximate).
 */
function getRecordingStartTime(recording: RecordingDetail): number | undefined {
  if (recording.recordingStartedAt) {
    return new Date(recording.recordingStartedAt).getTime();
  }
  if (recording.meta.createdAt) {
    return new Date(recording.meta.createdAt).getTime() - recording.recordingDurationMs;
  }
  return undefined;
}

type LogData<T> = { data: T[] | null; loading: boolean; error: string | null };

export function RecordingTabs({ recording, resources }: RecordingTabsProps) {
  const recordingStartTime = getRecordingStartTime(recording);

  // Lazy-loaded log data — fetched from presigned URLs when tab is first activated
  const [consoleLogs, setConsoleLogs] = useState<LogData<ConsoleLogEntry>>({
    data: null,
    loading: false,
    error: null,
  });
  const [networkLogs, setNetworkLogs] = useState<LogData<NetworkLogEntry>>({
    data: null,
    loading: false,
    error: null,
  });
  const [actionLogs, setActionLogs] = useState<LogData<ActionLogEntry>>({
    data: null,
    loading: false,
    error: null,
  });

  // Track which tabs have been loaded
  const loaded = useRef<Set<string>>(new Set());

  const fetchLogData = useCallback(
    async <T,>(url: string | null, setter: React.Dispatch<React.SetStateAction<LogData<T>>>) => {
      if (!url) {
        setter({ data: [], loading: false, error: null });
        return;
      }
      setter((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setter({ data: Array.isArray(data) ? data : [], loading: false, error: null });
      } catch (err) {
        setter({ data: null, loading: false, error: String(err) });
      }
    },
    []
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      if (loaded.current.has(tab)) return;
      loaded.current.add(tab);

      switch (tab) {
        case 'console':
          fetchLogData<ConsoleLogEntry>(resources.consoleLog.url, setConsoleLogs);
          break;
        case 'network':
          fetchLogData<NetworkLogEntry>(resources.networkLog.url, setNetworkLogs);
          break;
        case 'actions':
          fetchLogData<ActionLogEntry>(resources.action.url, setActionLogs);
          break;
      }
    },
    [resources, fetchLogData]
  );

  return (
    <Tabs defaultValue="info" onValueChange={handleTabChange} className="flex flex-col h-full">
      <TabsList>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="console">Console</TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="info" className="h-full">
          <InfoTab recording={recording} />
        </TabsContent>

        <TabsContent value="console" className="h-full">
          {consoleLogs.loading ? (
            <LoadingState message="Loading console logs..." />
          ) : consoleLogs.error ? (
            <ErrorState message={consoleLogs.error} />
          ) : (
            <ConsoleTab data={consoleLogs.data ?? []} recordingStartTime={recordingStartTime} />
          )}
        </TabsContent>

        <TabsContent value="network" className="h-full">
          {networkLogs.loading ? (
            <LoadingState message="Loading network logs..." />
          ) : networkLogs.error ? (
            <ErrorState message={networkLogs.error} />
          ) : (
            <NetworkTab data={networkLogs.data ?? []} recordingStartTime={recordingStartTime} />
          )}
        </TabsContent>

        <TabsContent value="actions" className="h-full">
          {actionLogs.loading ? (
            <LoadingState message="Loading actions..." />
          ) : actionLogs.error ? (
            <ErrorState message={actionLogs.error} />
          ) : (
            <ActionsTab data={actionLogs.data ?? []} recordingStartTime={recordingStartTime} />
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-sm font-medium text-destructive mb-1">Failed to load data</p>
      <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
