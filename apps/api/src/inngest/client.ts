import { EventSchemas, Inngest } from 'inngest';

/**
 * Typed event map for all Inngest events
 */
type Events = {
  'recording/delete-resources': {
    data: { recordingId: string };
  };
  'workspace/delete-resources': {
    data: { workspaceId: string };
  };
  'project/delete-resources': {
    data: { projectId: string };
  };
  'link/delete-resources': {
    data: { linkId: string };
  };
  'recording/check-stale': {
    data: { recordingId: string };
  };
  'workspace/cleanup-orphaned': {
    data: { workspaceId: string };
  };
  'project/cleanup-orphaned': {
    data: { projectId: string };
  };
  'recording/sweep-expired': {
    data: Record<string, never>;
  };
};

export const inngest = new Inngest({
  id: 'userplane-api',
  schemas: new EventSchemas().fromRecord<Events>(),
});
