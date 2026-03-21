'use client';

/**
 * ClientProvider — Loads the ZAF SDK and initializes the client.
 *
 * Owns the full lifecycle:
 * 1. Loads the ZAF SDK via next/script with onReady callback
 * 2. Calls ZAFClient.init() once the SDK is loaded
 * 3. Waits for the app.registered event from Zendesk
 * 4. Provides the client via context to all children
 */

import Script from 'next/script';
import { createContext, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import type { ZAFClientInstance } from '@/lib/zendesk/types';

export const ClientContext = createContext<ZAFClientInstance | null>(null);

const ZAF_SDK_URL = 'https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js';
const REGISTRATION_TIMEOUT_MS = 10_000;

export function ClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ZAFClientInstance | null>(null);
  const [appRegistered, setAppRegistered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSdkReady = useCallback(() => {
    if (typeof window.ZAFClient === 'undefined') {
      setTimedOut(true);
      return;
    }

    const zafClient = window.ZAFClient.init();

    zafClient.on('app.registered', () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setClient(zafClient);
      setAppRegistered(true);
    });

    // Timeout if app.registered never fires (e.g. not inside Zendesk)
    timerRef.current = setTimeout(() => {
      setTimedOut(true);
    }, REGISTRATION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (timedOut && !appRegistered) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#cc3340' }}>
        <p style={{ fontWeight: 600 }}>Failed to connect to Zendesk</p>
        <p style={{ fontSize: '13px', color: '#68737d' }}>
          This app must be loaded inside Zendesk. Please reload the page or contact support.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script src={ZAF_SDK_URL} strategy="afterInteractive" onReady={handleSdkReady} />
      {appRegistered && client ? (
        <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <span>Loading...</span>
        </div>
      )}
    </>
  );
}
