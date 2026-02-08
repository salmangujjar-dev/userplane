'use client';

import Intercom from '@intercom/messenger-js-sdk';
import { useEffect } from 'react';

interface IntercomProviderProps {
  appId: string;
  apiBase?: string;
  children: React.ReactNode;
}

export function IntercomProvider({
  appId,
  apiBase = 'https://api-iam.intercom.io',
  children,
}: IntercomProviderProps) {
  useEffect(() => {
    // Initialize Intercom on client-side
    const initializeIntercom = async () => {
      try {
        // Try to fetch JWT from server-side API for secure authentication
        const response = await fetch('/api/intercom-jwt');
        const data = await response.json();

        if (data.token) {
          // Initialize Intercom with JWT authentication
          Intercom({
            app_id: appId,
            api_base: apiBase,
            user_hash: data.token,
            session_duration: 86400000, // 1 day in ms
            alignment: 'right',
            horizontal_padding: 20,
            vertical_padding: 20,
          });
        } else {
          console.error('Failed to get Intercom JWT:', data.error);
          // Fallback: Initialize without JWT
          Intercom({
            app_id: appId,
            alignment: 'right',
            horizontal_padding: 20,
            vertical_padding: 20,
          });
        }
      } catch (error) {
        console.error('Error initializing Intercom:', error);
        // Fallback: Initialize without JWT
        Intercom({
          app_id: appId,
          alignment: 'right',
          horizontal_padding: 20,
          vertical_padding: 20,
        });
      }
    };

    initializeIntercom();
  }, [appId, apiBase]);

  return <>{children}</>;
}
