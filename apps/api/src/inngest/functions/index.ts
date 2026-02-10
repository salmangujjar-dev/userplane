import { checkStaleRecording } from './check-stale-recording';
import { deleteLinkResources } from './delete-link-resources';
import { deleteProjectResources } from './delete-project-resources';
import { deleteRecordingResources } from './delete-recording-resources';
import { deleteWorkspaceResources } from './delete-workspace-resources';
import { sweepExpiredRecordings } from './sweep-expired-recordings';
import { cleanupOrphanedProject, sweepOrphanedProjects } from './sweep-orphaned-projects';
import { sweepOrphanedRecordings } from './sweep-orphaned-recordings';
import { cleanupOrphanedWorkspace, sweepOrphanedWorkspaces } from './sweep-orphaned-workspaces';

export const allFunctions = [
  deleteRecordingResources,
  checkStaleRecording,
  deleteLinkResources,
  deleteProjectResources,
  deleteWorkspaceResources,
  cleanupOrphanedWorkspace,
  sweepOrphanedWorkspaces,
  cleanupOrphanedProject,
  sweepOrphanedProjects,
  sweepOrphanedRecordings,
  sweepExpiredRecordings,
];
