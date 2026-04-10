'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { isFailureActive } from '@/lib/feature-flags';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isFailureActive('signIn')) {
      console.error('[Auth] Authentication service is temporarily unavailable');
      setError('Authentication service is temporarily unavailable. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/',
      });

      if (authError) {
        setError(authError.message ?? 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Image src="/media/Ramp_idxW_Yq9Eu_1.svg" alt="Ramp" width={100} height={28} priority />
        <h1 className="text-xl font-semibold text-foreground">Sign in to your account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            required
            autoComplete="email"
          />
        </Field>

        <Field>
          <FieldLabel>Password</FieldLabel>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            autoComplete="current-password"
          />
        </Field>

        {error && <p className="text-destructive-foreground text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          render={<button type="submit" />}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  );
}
