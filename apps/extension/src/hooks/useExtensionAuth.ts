import { useCallback, useEffect, useState } from 'react';

import type { SessionCheckResponse, SessionUser } from '@/lib/messaging';
import { sendMessage } from '@/lib/messaging';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

interface UseExtensionAuthReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useExtensionAuth(): UseExtensionAuthReturn {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const response = await sendMessage<SessionCheckResponse>({
        type: 'CHECK_SESSION',
      });

      if (response.authenticated && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const handleFocus = () => {
      void checkSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession]);

  const signIn = useCallback(async () => {
    await chrome.tabs.create({ url: `${DASH_URL}/auth` });
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await sendMessage({ type: 'SIGN_OUT' });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshSession: checkSession,
    signIn,
    signOut,
  };
}
