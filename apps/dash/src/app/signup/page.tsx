'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function SignUpPageContent() {
  const [mode, setMode] = useState<AuthMode>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to');
  const { signUpWithEmail, signInWithMagicLink } = useAuth();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      logger.info({ provider: 'email', redirectTo }, 'Initiating email sign up');
      const result = await signUpWithEmail({
        name,
        email,
        password,
        redirectTo: redirectTo || undefined,
      });

      if (result.error) {
        logger.error({ err: result.error, provider: 'email' }, 'Email sign up failed');
        toast.error(result.error.message || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      logger.info({ provider: 'email' }, 'Email sign up successful, verification email sent');
      setVerificationEmailSent(true);
      setIsLoading(false);
    } catch (error) {
      logger.error({ err: error, provider: 'email' }, 'Email sign up failed');
      toast.error('Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      logger.info({ provider: 'magic-link', redirectTo }, 'Initiating magic link sign up');
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

  if (verificationEmailSent) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">Verify your email</p>
          </div>

          <div className="space-y-6 text-center">
            <div className="p-6 rounded-lg bg-muted/50">
              <p className="text-foreground mb-2">We sent a verification link to</p>
              <p className="font-medium text-foreground">{email}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Click the link in your email to verify your account and complete registration.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Already verified?{' '}
              <Link
                href={
                  redirectTo ? `/signin?redirect_to=${encodeURIComponent(redirectTo)}` : '/signin'
                }
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
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
                Click the link in your email to create your account. The link will expire in 10
                minutes.
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
          <p className="text-sm text-muted-foreground">Create your account</p>
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
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} size="lg" className="w-full rounded-full">
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSignUp} className="space-y-4">
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
              <p className="text-sm text-muted-foreground">
                We&apos;ll send you a magic link to create your account without a password.
              </p>
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
            Already have an account?{' '}
            <Link
              href={
                redirectTo ? `/signin?redirect_to=${encodeURIComponent(redirectTo)}` : '/signin'
              }
              className="font-medium text-foreground hover:underline"
            >
              Sign in
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

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageContent />
    </Suspense>
  );
}
