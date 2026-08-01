import { eventType, Inngest, staticSchema } from 'inngest';

import { EVENT_NAMES } from './constants';

/**
 * Typed event definitions for all Inngest events.
 *
 * Inngest v4 removed `EventSchemas`; events are now declared individually with
 * `eventType`. `staticSchema` supplies compile-time types without a runtime
 * validation library, matching the previous `fromRecord` behaviour.
 *
 * These are used both as function triggers and as the source of `event.data`
 * typing inside handlers.
 */
export const EVENTS = {
  deleteRecordingResources: eventType(EVENT_NAMES.DELETE_RECORDING_RESOURCES, {
    schema: staticSchema<{ recordingId: string }>(),
  }),
  deleteLinkResources: eventType(EVENT_NAMES.DELETE_LINK_RESOURCES, {
    schema: staticSchema<{ linkId: string }>(),
  }),
  deleteProjectResources: eventType(EVENT_NAMES.DELETE_PROJECT_RESOURCES, {
    schema: staticSchema<{ projectId: string }>(),
  }),
  deleteWorkspaceResources: eventType(EVENT_NAMES.DELETE_WORKSPACE_RESOURCES, {
    schema: staticSchema<{ workspaceId: string }>(),
  }),
  cleanupOrphanedWorkspace: eventType(EVENT_NAMES.CLEANUP_ORPHANED_WORKSPACE, {
    schema: staticSchema<{ workspaceId: string }>(),
  }),
  cleanupOrphanedProject: eventType(EVENT_NAMES.CLEANUP_ORPHANED_PROJECT, {
    schema: staticSchema<{ projectId: string }>(),
  }),
  checkStaleRecording: eventType(EVENT_NAMES.CHECK_STALE_RECORDING, {
    schema: staticSchema<{ recordingId: string }>(),
  }),
} as const;

export const inngest = new Inngest({
  id: 'userplane-api',
});
