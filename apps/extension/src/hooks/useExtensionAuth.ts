import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { SessionCheckResponse, SessionUser } from '@/lib/messaging';
import { sendMessage } from '@/lib/messaging';
import { SESSION_USER_KEY } from '@/lib/storage';
import { useWorkspaceStore } from '@/stores/workspace';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

interface UseExtensionAuthReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ExtensionAuthContext = createContext<UseExtensionAuthReturn | null>(null);

function useProvideExtensionAuth(): UseExtensionAuthReturn {
  const queryClient = useQueryClient();
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wasAuthenticatedRef = useRef(false);

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
    // Awaited inside so the state updates land in an async continuation rather
    // than synchronously during the effect.
    void (async () => {
      await checkSession();
    })();
  }, [checkSession]);

  useEffect(() => {
    // Mirror background session-cache changes into React state so sign-out and
    // 401-driven auth expiry push the shell back to the correct auth view immediately.
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const userChange = changes[SESSION_USER_KEY];
      if (!userChange) return;

      setUser((userChange.newValue as SessionUser | null | undefined) ?? null);
      setIsLoading(false);
    };

    chrome.storage.session.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.session.onChanged.removeListener(handleStorageChange);
  }, []);

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

  useEffect(() => {
    // Drop cached data from the prior authenticated session before another user
    // signs in, otherwise stale workspace/query state can bleed across accounts.
    if (!user && wasAuthenticatedRef.current) {
      queryClient.clear();
      clearWorkspace();
    }

    wasAuthenticatedRef.current = !!user;
  }, [clearWorkspace, queryClient, user]);

  const signIn = useCallback(async () => {
    // `session_expired=true` tells dash middleware to allow `/auth` even when a
    // stale session cookie is present, so extension-triggered sign-in can't get bounced.
    await chrome.tabs.create({ url: `${DASH_URL}/auth?session_expired=true` });
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

export function ExtensionAuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideExtensionAuth();
  return createElement(ExtensionAuthContext.Provider, { value }, children);
}

export function useExtensionAuth(): UseExtensionAuthReturn {
  const context = useContext(ExtensionAuthContext);
  if (!context) {
    throw new Error('useExtensionAuth must be used within an ExtensionAuthProvider');
  }

  return context;
}
