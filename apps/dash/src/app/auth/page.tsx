'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Field, FieldError } from '@workspace/ui/components/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Suspense, useState } from 'react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';

import { AuthIcons } from '@/components/auth/auth-icons';
import { useAuth } from '@/hooks';
import {
  showAuthenticationFailedToast,
  showMagicLinkFailedToast,
  showMagicLinkSentToast,
} from '@/lib/toasts';

const magicLinkSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

// Subcomponents
function AuthLayout({
  children,
  bottomContent,
}: {
  children: React.ReactNode;
  bottomContent?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">{children}</div>
      {bottomContent}
    </div>
  );
}

function AuthHeader({ subtitle }: { subtitle: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link href="/">
        <Logo />
      </Link>
      <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
    </div>
  );
}

function AuthFooter() {
  return (
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
  );
}

function GoogleIcon() {
  return (
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
  );
}

function GoogleSignInButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <div>
      <Button
        onClick={onClick}
        disabled={isLoading}
        variant="secondary"
        size="lg"
        className="w-full rounded-full px-7 py-6"
      >
        {isLoading ? 'Signing in...' : 'Continue with Google'}
        <GoogleIcon />
      </Button>
      <div className="min-h-[20px] mt-1.5" />
    </div>
  );
}

function MagicLinkForm({
  form,
  onSubmit,
  isLoading,
}: {
  form: UseFormReturn<MagicLinkFormData>;
  onSubmit: (data: MagicLinkFormData) => void;
  isLoading: boolean;
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-0">
            <InputGroup className="h-12 rounded-full [--radius:1.5rem]">
              <InputGroupInput
                {...field}
                type="email"
                placeholder="you@example.com"
                disabled={isLoading}
                className="text-base pl-7 pr-2"
                aria-invalid={fieldState.invalid}
                autoComplete="email"
              />
              {field.value.trim() && !fieldState.invalid && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="submit"
                    disabled={isLoading}
                    variant="default"
                    size="sm"
                    className="rounded-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <div className="min-h-[20px] mt-1.5">
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} className="text-center text-xs" />
              )}
            </div>
          </Field>
        )}
      />
    </form>
  );
}

function AuthToggle({ useMagicLink, onToggle }: { useMagicLink: boolean; onToggle: () => void }) {
  return (
    <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
      <button
        onClick={onToggle}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {useMagicLink ? 'Continue with Google' : 'Continue with Magic Link'}
      </button>
    </div>
  );
}

function MagicLinkSentView({ email, onTryAgain }: { email: string; onTryAgain: () => void }) {
  return (
    <AuthLayout
      bottomContent={
        <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Didn&apos;t receive the email?</span>
            <button onClick={onTryAgain} className="text-foreground hover:underline font-medium">
              Try again
            </button>
          </div>
        </div>
      }
    >
      <AuthHeader
        subtitle={
          <>
            We sent a magic link to <span className="font-medium text-foreground">{email}</span>
          </>
        }
      />

      <div className="min-h-[74px]" />
    </AuthLayout>
  );
}

function AuthPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to');
  const { signInWithGoogle, signInWithMagicLink } = useAuth();

  const form = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onTouched',
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle(redirectTo || undefined);
    } catch (error) {
      posthog.captureException(error, {
        error_boundary: 'auth',
        provider: 'google',
      });
      showAuthenticationFailedToast();
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (data: MagicLinkFormData) => {
    try {
      setIsLoading(true);

      const result = await signInWithMagicLink({
        email: data.email,
        redirectTo: redirectTo || undefined,
      });

      if (result?.error) {
        posthog.captureException(result.error, {
          error_boundary: 'auth',
          email: data.email,
        });
        showMagicLinkFailedToast(result.error.message);
        return;
      }

      setSentEmail(data.email);
      setMagicLinkSent(true);
      showMagicLinkSentToast();
    } catch (error) {
      posthog.captureException(error, {
        error_boundary: 'auth',
        email: data.email,
      });
      showMagicLinkFailedToast();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setMagicLinkSent(false);
    setSentEmail('');
    form.reset();
  };

  if (magicLinkSent) {
    return <MagicLinkSentView email={sentEmail} onTryAgain={handleTryAgain} />;
  }

  return (
    <AuthLayout
      bottomContent={
        <AuthToggle useMagicLink={useMagicLink} onToggle={() => setUseMagicLink(!useMagicLink)} />
      }
    >
      <AuthHeader subtitle="Quick auth and you're in" />

      <div className="space-y-6">
        <div className="min-h-[74px]">
          {useMagicLink ? (
            <MagicLinkForm form={form} onSubmit={handleMagicLinkSignIn} isLoading={isLoading} />
          ) : (
            <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={isLoading} />
          )}
        </div>

        <AuthFooter />
      </div>
    </AuthLayout>
  );
}

function AuthPageSkeleton() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Link href="/">
            <Logo />
          </Link>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
        <Skeleton className="h-10 w-80 mx-auto" />
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthPageContent />
    </Suspense>
  );
}
