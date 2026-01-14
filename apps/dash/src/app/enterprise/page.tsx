'use client';

import { useState, Suspense } from 'react';
import { useQueryState } from 'nuqs';
import { useAuth } from '@/hooks';
import { logger } from '@/logger';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { toast } from '@workspace/ui/components/sonner';
import Link from 'next/link';
import { AuthIcons } from '@/components/auth/auth-icons';

type AuthAction = 'signin' | 'signup';

function EnterprisePageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [email, setEmail] = useQueryState('email', { defaultValue: '' });
  const [action, setAction] = useQueryState<AuthAction>('action', {
    defaultValue: 'signin',
    parse: (value) => (value === 'signup' ? 'signup' : 'signin'),
  });
  const [redirectTo] = useQueryState('redirect_to');
  const { signInWithGoogle, signInWithMagicLink } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      logger.info({ provider: 'google', redirectTo }, 'Initiating Google authentication');
      await signInWithGoogle(redirectTo || undefined);
      logger.info({ provider: 'google' }, 'Google authentication successful');
    } catch (error) {
      logger.error({ err: error, provider: 'google' }, 'Authentication failed');
      toast.error('Failed to authenticate. Please try again.');
      setIsLoading(false);
    }
  };

  const handleMagicLinkAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      const actionText = action === 'signup' ? 'sign up' : 'sign in';
      logger.info(
        { provider: 'magic-link', action, redirectTo },
        `Initiating magic link ${actionText}`
      );
      const result = await signInWithMagicLink({
        email,
        redirectTo: redirectTo || undefined,
      });

      if (result.error) {
        logger.error(
          { err: result.error, provider: 'magic-link', action },
          'Magic link request failed'
        );
        toast.error(result.error.message || 'Failed to send magic link. Please try again.');
        setIsLoading(false);
        return;
      }

      logger.info({ provider: 'magic-link', action }, 'Magic link sent successfully');
      setMagicLinkSent(true);
      setIsLoading(false);
    } catch (error) {
      logger.error({ err: error, provider: 'magic-link', action }, 'Magic link request failed');
      toast.error('Failed to send magic link. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleAction = () => {
    setAction(action === 'signin' ? 'signup' : 'signin');
  };

  if (magicLinkSent) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">You&apos;re almost there</p>
          </div>

          <div className="space-y-6 text-center">
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-foreground mb-2">We&apos;ve sent a magic link to</p>
              <p className="font-medium text-foreground">{email}</p>
              <p className="text-sm text-muted-foreground mt-4">
                to sign you in. It expires in 10 minutes.
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setMagicLinkSent(false);
                setEmail('');
              }}
              className="w-full"
            >
              Use a different email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Link href="/">
            <Logo />
          </Link>
          <p className="text-sm text-muted-foreground">
            {action === 'signup' ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="space-y-3">
          <form onSubmit={handleMagicLinkAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="rounded-lg"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full rounded-full px-7 py-6"
            >
              {isLoading ? 'Sending link...' : action === 'signup' ? 'Sign up' : 'Sign in'}
            </Button>
          </form>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="secondary"
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isLoading ? 'Signing in...' : 'Continue with Google'}
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={toggleAction}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {action === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EnterprisePage() {
  return (
    <Suspense fallback={null}>
      <EnterprisePageContent />
    </Suspense>
  );
}
