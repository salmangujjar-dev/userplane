import { authClient } from '@/client/auth';

/**
 * Custom hook for authentication operations
 * Provides methods for sign in, sign out, sign up, impersonation, etc.
 */
export function useAuth() {
  const signOut = async () => {
    await authClient.signOut();
    window.location.href = '/auth';
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const callbackURL = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/`;

    await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    });
  };

  /**
   * Stop impersonating a user and return to the admin's own session.
   * This will reload the page to refresh the session state.
   */
  const stopImpersonating = async () => {
    await authClient.admin.stopImpersonating();
    window.location.href = '/';
  };

  return {
    signOut,
    signInWithGoogle,
    stopImpersonating,
  };
}
