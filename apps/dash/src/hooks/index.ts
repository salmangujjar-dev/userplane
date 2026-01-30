/**
 * Custom hooks for the dashboard application
 * Only contains utility hooks - NOT React Query hooks
 *
 * For React Query hooks, import directly from @/features/{feature}
 */

// Auth utilities
export { useAuth } from './use-auth';

// Domain utilities
export { useDomainSectionState } from './use-domain-section-state';
export {
  useFetchDomainSettings,
  usePollDomainVerification,
  useStartDomainVerification,
  useVerificationFlow,
} from './use-verification-flow';

// UI utilities
export { useDebouncedValue } from './use-debounced-value';
export { useClearClientCache, useClearServerCache } from './use-diagnostics';
export { useFavicon } from './use-favicon';
export { usePagination } from './use-pagination';
export { usePermissions } from './use-permissions';

// Search utilities (combine React Query hooks with debounce)
export { useSearchableLinks } from './use-searchable-links';
export { useSearchableMembers } from './use-searchable-members';
export { useSearchableProjects } from './use-searchable-projects';
