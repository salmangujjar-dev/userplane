'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { logger } from '@/logger';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { toast } from '@workspace/ui/components/sonner';
import Link from 'next/link';
import { AuthIcons } from '@/components/auth/auth-icons';

type AuthMode = 'email' | 'magic-link';

function SignInPageContent() {
  const [mode, setMode] = useState<AuthMode>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirect_to');
  const { signInWithEmail, signInWithMagicLink, sendVerificationEmail } = useAuth();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    try {
      setIsLoading(true);
      logger.info({ provider: 'email', redirectTo }, 'Initiating email sign in');
      const result = await signInWithEmail({
        email,
        password,
        redirectTo: redirectTo || undefined,
      });

      if (result.error) {
        logger.error({ err: result.error, provider: 'email' }, 'Email sign in failed');
        // Check if the error is due to unverified email (403 status)
        if (result.error.status === 403) {
          setNeedsVerification(true);
          setIsLoading(false);
          return;
        }
        toast.error(result.error.message || 'Failed to sign in. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      logger.info({ provider: 'email' }, 'Email sign in successful');
      router.push(redirectTo || '/');
    } catch (error) {
      logger.error({ err: error, provider: 'email' }, 'Email sign in failed');
      toast.error('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      logger.info({ email }, 'Resending verification email');
      const result = await sendVerificationEmail({
        email,
        redirectTo: redirectTo || undefined,
      });

      if (result.error) {
        logger.error({ err: result.error }, 'Failed to resend verification email');
        toast.error(result.error.message || 'Failed to send verification email. Please try again.');
        setIsLoading(false);
        return;
      }

      logger.info({ email }, 'Verification email resent');
      setVerificationSent(true);
      setIsLoading(false);
    } catch (error) {
      logger.error({ err: error }, 'Failed to resend verification email');
      toast.error('Failed to send verification email. Please try again.');
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      logger.info({ provider: 'magic-link', redirectTo }, 'Initiating magic link sign in');
      const result = await signInWithMagicLink({
        email,
        redirectTo: redirectTo || undefined,
      });

      if (result.error) {
        logger.error({ err: result.error, provider: 'magic-link' }, 'Magic link request failed');
        toast.error(result.error.message || 'Failed to send magic link. Please try again.');
        setIsLoading(false);
        return;
      }

      logger.info({ provider: 'magic-link' }, 'Magic link sent successfully');
      setMagicLinkSent(true);
      setIsLoading(false);
    } catch (error) {
      logger.error({ err: error, provider: 'magic-link' }, 'Magic link request failed');
      toast.error('Failed to send magic link. Please try again.');
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">Check your email</p>
          </div>

          <div className="space-y-6 text-center">
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-foreground mb-2">We sent a verification link to</p>
              <p className="font-medium text-foreground">{email}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Click the link in your email to verify your account, then try signing in again.
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setVerificationSent(false);
                setNeedsVerification(false);
              }}
              className="w-full"
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">Email not verified</p>
          </div>

          <div className="space-y-6 text-center">
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-foreground mb-2">Please verify your email address</p>
              <p className="font-medium text-foreground">{email}</p>
              <p className="text-sm text-muted-foreground mt-4">
                You need to verify your email before you can sign in. Check your inbox for a
                verification link, or click below to resend it.
              </p>
            </div>

            <Button
              onClick={handleResendVerification}
              disabled={isLoading}
              size="lg"
              className="w-full rounded-full"
            >
              {isLoading ? 'Sending...' : 'Resend verification email'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setNeedsVerification(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full"
            >
              Use a different account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">Check your email</p>
          </div>

          <div className="space-y-6 text-center">
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-foreground mb-2">We sent a magic link to</p>
              <p className="font-medium text-foreground">{email}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Click the link in your email to sign in. The link will expire in 10 minutes.
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
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-muted rounded-full">
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                mode === 'email'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setMode('magic-link')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                mode === 'magic-link'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Magic Link
            </button>
          </div>

          {mode === 'email' ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} size="lg" className="w-full rounded-full">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} size="lg" className="w-full rounded-full">
                {isLoading ? 'Sending link...' : 'Send magic link'}
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={
                redirectTo ? `/signup?redirect_to=${encodeURIComponent(redirectTo)}` : '/signup'
              }
              className="font-medium text-foreground hover:underline"
            >
              Sign up
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Prefer social login?{' '}
            <Link
              href={redirectTo ? `/auth?redirect_to=${encodeURIComponent(redirectTo)}` : '/auth'}
              className="font-medium text-foreground hover:underline"
            >
              Continue with Google
            </Link>
          </p>
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

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageContent />
    </Suspense>
  );
}
