'use client';

import * as userplane from '@workspace/sdk';
import { useEffect } from 'react';

interface UserplaneProviderProps {
  workspaceId: string;
  children: React.ReactNode;
}

export function UserplaneProvider({ workspaceId, children }: UserplaneProviderProps) {
  useEffect(() => {
    // Initialize Userplane SDK on client-side
    if (typeof window !== 'undefined') {
      userplane.initialize({
        workspaceId: [workspaceId],
      });
    }
  }, [workspaceId]);

  return <>{children}</>;
}
