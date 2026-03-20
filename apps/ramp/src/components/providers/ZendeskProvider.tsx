'use client';

import { useEffect } from 'react';

import { log } from '@/lib/client-logger';

interface ZendeskProviderProps {
  zendeskKey: string;
  children: React.ReactNode;
}

function authenticateUser(maxAttempts = 20) {
  let attempts = 0;

  const check = () => {
    attempts++;
    if (window.zE) {
      window.zE('messenger', 'loginUser', (callback: (jwt: string) => void) => {
        fetch('/api/zendesk-jwt')
          .then((res) => res.json())
          .then((data) => {
            if (data.token) {
              callback(data.token);
              log.debug('ZendeskProvider: user authenticated');
            } else {
              log.error('ZendeskProvider: no token from /api/zendesk-jwt');
            }
          })
          .catch((error) => {
            log.error({ err: error }, 'ZendeskProvider: JWT fetch failed');
          });
      });
    } else if (attempts < maxAttempts) {
      setTimeout(check, 250);
    } else {
      log.error('ZendeskProvider: zE not available after timeout');
    }
  };

  check();
}

export function ZendeskProvider({ zendeskKey, children }: ZendeskProviderProps) {
  useEffect(() => {
    if (document.getElementById('ze-snippet')) {
      return;
    }

    log.debug({ zendeskKey }, 'ZendeskProvider initializing');

    const script = document.createElement('script');
    script.id = 'ze-snippet';
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${zendeskKey}`;
    script.async = true;
    script.onload = () => {
      log.debug('ZendeskProvider widget script loaded');
      authenticateUser();
    };
    script.onerror = () => {
      log.error('ZendeskProvider failed to load widget script');
    };
    document.body.appendChild(script);

    return () => {
      if (window.zE) {
        try {
          window.zE('messenger', 'logoutUser');
        } catch {
          // Already torn down
        }
      }

      const el = document.getElementById('ze-snippet');
      if (el) el.remove();

      const zendeskElements = document.querySelectorAll('[id^="launcher"], [id^="webWidget"]');
      zendeskElements.forEach((el) => el.remove());

      if (window.zE) {
        delete (window as unknown as Record<string, unknown>).zE;
      }
    };
  }, [zendeskKey]);

  return <>{children}</>;
}

declare global {
  interface Window {
    zE?: (...args: unknown[]) => void;
  }
}
