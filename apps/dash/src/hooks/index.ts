/**
 * Custom hooks for the dashboard application
 * Centralized exports for all custom hooks
 */
export { useAuth } from './use-auth';
export { useWorkspaces } from './use-workspaces';
export {
  useWorkspaceInvite,
  useSendWorkspaceInvites,
  useValidateInvite,
  useAcceptInvite,
} from './use-workspace-invite';
