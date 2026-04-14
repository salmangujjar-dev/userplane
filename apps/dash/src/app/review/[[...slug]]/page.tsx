'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@userplane/ui/components/button';
import { Field, FieldError } from '@userplane/ui/components/field';
import { InputGroup, InputGroupInput } from '@userplane/ui/components/input-group';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { AuthFooter, AuthHeader, AuthLayout } from '@/components/auth/auth-shell';
import { useAuth } from '@/hooks';
import { showAuthenticationFailedToast } from '@/lib/toasts';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

function ModeToggle({ isSignUp, onToggle }: { isSignUp: boolean; onToggle: () => void }) {
  return (
    <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
        <button onClick={onToggle} className="text-foreground hover:underline font-medium">
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </div>
    </div>
  );
}

function VerificationSentView({ email, onTryAgain }: { email: string; onTryAgain: () => void }) {
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
            We sent a verification link to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </>
        }
      />
      <div className="min-h-[74px]" />
    </AuthLayout>
  );
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail } = useAuth();

  const form = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const handleSubmit = async (data: SignInData) => {
    try {
      setIsLoading(true);
      const result = await signInWithEmail({ email: data.email, password: data.password });

      if (result?.error) {
        form.setError('root', { message: result.error.message || 'Invalid email or password' });
        return;
      }

      onSuccess();
    } catch {
      showAuthenticationFailedToast();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-1">
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-0">
            <InputGroup className="h-12 rounded-md">
              <InputGroupInput
                {...field}
                type="email"
                placeholder="you@userplane.io"
                disabled={isLoading}
                className="text-base pl-7 pr-7"
                aria-invalid={fieldState.invalid}
                autoComplete="email"
              />
            </InputGroup>
            <div className="min-h-[20px] mt-1.5">
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} className="text-center text-xs" />
              )}
            </div>
          </Field>
        )}
      />

      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-0">
            <InputGroup className="h-12 rounded-md">
              <InputGroupInput
                {...field}
                type="password"
                placeholder="Password"
                disabled={isLoading}
                className="text-base pl-7 pr-7"
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
              />
            </InputGroup>
            <div className="min-h-[20px] mt-1.5">
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} className="text-center text-xs" />
              )}
            </div>
          </Field>
        )}
      />

      {form.formState.errors.root && (
        <p className="text-center text-xs text-destructive pt-1">
          {form.formState.errors.root.message}
        </p>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          variant="secondary"
          size="lg"
          className="w-full px-7 py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { signUpWithEmail } = useAuth();

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const handleSubmit = async (data: SignUpData) => {
    try {
      setIsLoading(true);
      const result = await signUpWithEmail({
        name: data.email,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        form.setError('root', { message: result.error.message || 'Failed to create account' });
        return;
      }

      onSuccess(data.email);
    } catch {
      showAuthenticationFailedToast();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-1">
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-0">
            <InputGroup className="h-12 rounded-md">
              <InputGroupInput
                {...field}
                type="email"
                placeholder="you@userplane.io"
                disabled={isLoading}
                className="text-base pl-7 pr-7"
                aria-invalid={fieldState.invalid}
                autoComplete="email"
              />
            </InputGroup>
            <div className="min-h-[20px] mt-1.5">
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} className="text-center text-xs" />
              )}
            </div>
          </Field>
        )}
      />

      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-0">
            <InputGroup className="h-12 rounded-md">
              <InputGroupInput
                {...field}
                type="password"
                placeholder="Password"
                disabled={isLoading}
                className="text-base pl-7 pr-7"
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
              />
            </InputGroup>
            <div className="min-h-[20px] mt-1.5">
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} className="text-center text-xs" />
              )}
            </div>
          </Field>
        )}
      />

      {form.formState.errors.root && (
        <p className="text-center text-xs text-destructive pt-1">
          {form.formState.errors.root.message}
        </p>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          variant="secondary"
          size="lg"
          className="w-full px-7 py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function ReviewPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  if (verificationEmail) {
    return (
      <VerificationSentView
        email={verificationEmail}
        onTryAgain={() => setVerificationEmail(null)}
      />
    );
  }

  return (
    <AuthLayout
      bottomContent={<ModeToggle isSignUp={isSignUp} onToggle={() => setIsSignUp(!isSignUp)} />}
    >
      <AuthHeader
        subtitle={isSignUp ? 'Create your reviewer account' : 'Sign in with reviewer credentials'}
      />

      <div className="space-y-6">
        {isSignUp ? (
          <SignUpForm onSuccess={(email) => setVerificationEmail(email)} />
        ) : (
          <SignInForm
            onSuccess={() => {
              window.location.href = '/';
            }}
          />
        )}

        <AuthFooter />
      </div>
    </AuthLayout>
  );
}
