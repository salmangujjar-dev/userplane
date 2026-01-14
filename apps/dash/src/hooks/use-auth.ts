import { authClient } from '@/client/auth';

export interface SignUpWithEmailParams {
  email: string;
  password: string;
  name: string;
  redirectTo?: string;
}

export interface SignInWithEmailParams {
  email: string;
  password: string;
  rememberMe?: boolean;
  redirectTo?: string;
}

export interface SignInWithMagicLinkParams {
  email: string;
  redirectTo?: string;
}

export interface SendVerificationEmailParams {
  email: string;
  redirectTo?: string;
}

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
   * Sign up with email and password
   */
  const signUpWithEmail = async ({ email, password, name, redirectTo }: SignUpWithEmailParams) => {
    const callbackURL = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/`;

    return await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL,
    });
  };

  /**
   * Sign in with email and password
   */
  const signInWithEmail = async ({
    email,
    password,
    rememberMe = true,
    redirectTo,
  }: SignInWithEmailParams) => {
    const callbackURL = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/`;

    return await authClient.signIn.email({
      email,
      password,
      rememberMe,
      callbackURL,
    });
  };

  /**
   * Sign in with magic link (passwordless)
   */
  const signInWithMagicLink = async ({ email, redirectTo }: SignInWithMagicLinkParams) => {
    const callbackURL = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/`;

    return await authClient.signIn.magicLink({
      email,
      callbackURL,
    });
  };

  /**
   * Link Google account to current user
   */
  const linkGoogle = async (redirectTo?: string) => {
    const callbackURL = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/`;

    await authClient.linkSocial({
      provider: 'google',
      callbackURL,
    });
  };

  /**
   * Send verification email to user
   */
  const sendVerificationEmail = async ({ email, redirectTo }: SendVerificationEmailParams) => {
    const callbackURL = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/`;

    return await authClient.sendVerificationEmail({
      email,
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
    signUpWithEmail,
    signInWithEmail,
    signInWithMagicLink,
    linkGoogle,
    sendVerificationEmail,
    stopImpersonating,
  };
}
