'use client';

import Intercom from '@intercom/messenger-js-sdk';
import { useEffect } from 'react';

import { log } from '@/lib/client-logger';

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
    const initializeIntercom = async () => {
      log.debug({ appId }, 'IntercomProvider initializing');
      try {
        // Fetch user identity and HMAC hash for Intercom identity verification
        const response = await fetch('/api/intercom-jwt');
        const data = await response.json();

        if (data.user_hash) {
          log.debug({ userId: data.user_id }, 'IntercomProvider identity verified');
          // Initialize Intercom with verified user identity
          Intercom({
            app_id: appId,
            api_base: apiBase,
            user_id: data.user_id,
            email: data.email,
            name: data.name,
            company: data.company,
            created_at: data.created_at,
            user_hash: data.user_hash,
            session_duration: 86400000, // 1 day in ms
            alignment: 'right',
            horizontal_padding: 20,
            vertical_padding: 20,
          });
          log.debug('IntercomProvider initialized with identity');
        } else {
          log.error({ error: data.error }, 'IntercomProvider identity fetch failed');
          // Fallback: Initialize as anonymous visitor
          Intercom({
            app_id: appId,
            alignment: 'right',
            horizontal_padding: 20,
            vertical_padding: 20,
          });
          log.debug('IntercomProvider initialized as anonymous');
        }
      } catch (error) {
        log.error({ err: error }, 'IntercomProvider initialization error');
        // Fallback: Initialize as anonymous visitor
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
