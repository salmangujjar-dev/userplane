import { authClient } from '@/client/auth';

/**
 * Custom hook for authentication operations
 * Provides methods for sign in, sign out, sign up, etc.
 */
export function useAuth() {
  const signOut = async () => {
    await authClient.signOut();
    window.location.href = '/auth';
  };

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/`,
    });
  };

  return {
    signOut,
    signInWithGoogle,
  };
}
