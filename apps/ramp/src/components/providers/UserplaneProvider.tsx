'use client';

import * as userplane from '@workspace/sdk';
import { useEffect } from 'react';

import { getFeatureFlagsMetadata } from '@/lib/feature-flags';

export type UserIdentity = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_company: string;
  user_created_at: string;
};

interface UserplaneProviderProps {
  workspaceId: string;
  user: UserIdentity;
  children: React.ReactNode;
}

export function UserplaneProvider({ workspaceId, user, children }: UserplaneProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Userplane SDK
    userplane.initialize({
      workspaceId: [workspaceId],
    });

    // Register user identity so sessions are not anonymous
    userplane.set('user', user);

    // Register feature flag state for observability
    userplane.set('featureFlags', getFeatureFlagsMetadata());
  }, [workspaceId, user]);

  return <>{children}</>;
}
