/**
 * Custom hooks for the dashboard application
 * Centralized exports for all custom hooks
 */
export { useAuth } from './use-auth';
export { useDomainSectionState } from './use-domain-section-state';
export { useDomainStatusPolling } from './use-domain-status-polling';
export {
  useFetchDomainSettings,
  usePollDomainVerification,
  useStartDomainVerification,
  useVerificationFlow,
} from './use-verification-flow';
export {
  useAcceptInvite,
  useSendWorkspaceInvites,
  useValidateInvite,
  useWorkspaceInvite,
} from './use-workspace-invite';
export { useWorkspaceNotifications } from './use-workspace-notifications';
export { useWorkspaceResourceCounts } from './use-workspace-resource-counts';
export { useWorkspaces } from './use-workspaces';
