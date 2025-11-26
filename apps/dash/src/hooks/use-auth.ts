import { authClient } from '@/client/auth';

/**
 * Custom hook for authentication operations
 * Provides methods for sign in, sign out, sign up, etc.
 */
export function useAuth() {
  const signOut = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/dashboard`,
    });
  };

  const signUpWithGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/dashboard`,
    });
  };

  return {
    signOut,
    signInWithGoogle,
    signUpWithGoogle,
  };
}
