import { useQuery } from '@tanstack/react-query';
import type {
  RecordingActionLog,
  RecordingConsoleLog,
  RecordingNetworkLog,
} from '@workspace/contract';

import { recordingKeys } from './query-keys';

async function fetchLogData<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch log data: ${response.status}`);
  }
  return response.json() as Promise<T[]>;
}

/**
 * Fetches console log data from a presigned URL.
 * Only fires when the URL is available.
 */
export function useConsoleLogData(
  workspaceId: string,
  recordingId: string,
  url: string | null | undefined
) {
  return useQuery({
    queryKey: recordingKeys.consoleLogData(workspaceId, recordingId),
    queryFn: () => fetchLogData<RecordingConsoleLog>(url!),
    enabled: !!url,
    staleTime: 50 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetches network log data from a presigned URL.
 * Only fires when the URL is available.
 */
export function useNetworkLogData(
  workspaceId: string,
  recordingId: string,
  url: string | null | undefined
) {
  return useQuery({
    queryKey: recordingKeys.networkLogData(workspaceId, recordingId),
    queryFn: () => fetchLogData<RecordingNetworkLog>(url!),
    enabled: !!url,
    staleTime: 50 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetches action log data from a presigned URL.
 * Only fires when the URL is available.
 */
export function useActionLogData(
  workspaceId: string,
  recordingId: string,
  url: string | null | undefined
) {
  return useQuery({
    queryKey: recordingKeys.actionLogData(workspaceId, recordingId),
    queryFn: () => fetchLogData<RecordingActionLog>(url!),
    enabled: !!url,
    staleTime: 50 * 60 * 1000,
    retry: 2,
  });
}
