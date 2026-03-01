'use client';

import * as userplane from '@workspace/sdk';
import { useEffect } from 'react';

import { log } from '@/lib/client-logger';
import {
  getActiveFailureFlags,
  getFeatureFlagsMetadata,
  isFeatureEnabled,
} from '@/lib/feature-flags';

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

const CONSOLE_NOISE_MESSAGES = [
  '[React] Cannot update a component while rendering a different component',
  '[SWR] An error occurred in the data fetching layer',
  'SecurityError: Blocked a frame with origin "null"',
  '[Next.js] Failed to fetch RSC payload',
];

export function UserplaneProvider({ workspaceId, user, children }: UserplaneProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    log.debug({ workspaceId }, 'UserplaneProvider initializing SDK');

    // Initialize Userplane SDK
    userplane.initialize({
      workspaceId: [workspaceId],
      verificationBaseUrl: process.env.NEXT_PUBLIC_VERIFICATION_BASE_URL,
      recorderBaseUrl: process.env.NEXT_PUBLIC_RECORDER_BASE_URL,
    });

    // Register user identity so sessions are not anonymous
    userplane.set('user', user);
    log.debug({ userId: user.user_id }, 'UserplaneProvider user identity set');

    // Register feature flag state for observability
    userplane.set('featureFlags', getFeatureFlagsMetadata());

    // Log active failure flags for session-level observability
    const activeFlags = getActiveFailureFlags();
    if (activeFlags.length > 0) {
      log.debug({ activeFlags }, 'UserplaneProvider active failure flags');
    }

    log.debug('UserplaneProvider initialized');
  }, [workspaceId, user]);

  // Console noise injection
  useEffect(() => {
    if (!isFeatureEnabled('consoleNoise')) return;

    let index = 0;
    const interval = setInterval(() => {
      console.error(CONSOLE_NOISE_MESSAGES[index % CONSOLE_NOISE_MESSAGES.length]);
      index++;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
