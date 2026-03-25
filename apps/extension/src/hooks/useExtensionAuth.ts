import { useCallback, useEffect, useState } from 'react';

import type { SessionCheckResponse, SessionUser } from '@/lib/messaging';
import { sendMessage } from '@/lib/messaging';

interface UseExtensionAuthReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await sendMessage<SessionCheckResponse>({
        type: 'SIGN_IN',
      });

      if (response.authenticated && response.user) {
        setUser(response.user);
      }
    } finally {
      setIsLoading(false);
    }
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
    signIn,
    signOut,
  };
}
