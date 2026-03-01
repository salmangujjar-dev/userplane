'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isFeatureEnabled('signUp')) {
      console.error('[Auth] Registration service is temporarily unavailable');
      setError('Registration service is temporarily unavailable. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: '/',
      });

      if (authError) {
        setError(authError.message ?? 'Failed to create account');
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
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            required
            autoComplete="name"
          />
        </Field>

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            autoComplete="new-password"
          />
        </Field>

        {error && <p className="text-destructive-foreground text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          render={<button type="submit" />}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
