'use client';

import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/client/auth';
import type { SessionData } from '@/types';

import { authKeys } from './query-keys';

/**
 * Hook to access the current session data with admin and impersonation status.
 *
 * This hook uses React Query to fetch the session from Better Auth and provides
 * additional computed properties for checking admin status and impersonation state.
 */
export function useSession() {
  const {
    data: sessionData,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) {
        // Not authenticated or session expired
        return null;
      }
      return result.data as SessionData | null;
    },
    staleTime: 60 * 1000, // 1 minute
    retry: false,
  });

  const user = sessionData?.user ?? null;
  const session = sessionData?.session ?? null;

  // Check if the current user has the admin role
  // Note: Users in adminUserIds without role="admin" can still perform admin operations
  // on the server, but this check only looks at the role field in the user data.
  const isAdmin = user?.role === 'admin';

  // Check if user has CSM role
  const isCsm = user?.role === 'csm';

  // Check if user has access to admin panel (admin or csm)
  const hasAdminAccess = isAdmin || isCsm;

  // Check if the current session is an impersonation session
  // The impersonatedBy field contains the ID of the admin who started the impersonation
  const impersonatedBy = session?.impersonatedBy ?? null;
  const isImpersonating = !!impersonatedBy;

  return {
    // Raw session data
    user,
    session,

    // Computed properties
    isAdmin,
    isCsm,
    hasAdminAccess,
    isImpersonating,
    impersonatedBy,

    // Loading and error states
    isPending,
    error,

    // Actions
    refetch,
  };
}
