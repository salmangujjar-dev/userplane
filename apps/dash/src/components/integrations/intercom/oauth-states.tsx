'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { AuthIcons } from '@/components/auth/auth-icons';
import type { DefinedError } from '@/lib/errors';

/**
 * Loading state shown during OAuth callback processing (before workspace creation).
 */
export function OAuthLoadingState() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-medium text-foreground">Setting up your workspace</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we connect your Intercom account...
              </p>
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface OAuthErrorAction {
  label: string;
  callback: () => void;
}

interface OAuthErrorStateProps {
  error: DefinedError;
  errorActionPrimary: OAuthErrorAction;
  errorActionSecondary: OAuthErrorAction;
}

/**
 * Error state shown when OAuth callback fails (workspace creation failed).
 */
export function OAuthErrorState({
  error,
  errorActionPrimary,
  errorActionSecondary,
}: OAuthErrorStateProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl font-medium text-foreground">Connection Failed</h1>
            <p className="text-sm text-muted-foreground text-center">{error.message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={errorActionPrimary.callback}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {errorActionPrimary.label}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={errorActionSecondary.callback}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {errorActionSecondary.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
