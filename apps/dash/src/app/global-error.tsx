'use client';

import { Button } from '@userplane/ui/components/button';
import Image from 'next/image';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { mediaClient } from '@/lib/media';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error, {
      error_boundary: 'global',
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-white">
          <div className="flex flex-col items-center gap-3 max-w-md">
            <Image
              src={mediaClient.getIconMediaUrl('icons/dino.svg')}
              alt="Error"
              width={120}
              height={120}
              className="mb-2"
            />
            <h1 className="text-xl font-medium text-zinc-900">Something went wrong</h1>
            <p className="text-sm text-zinc-500 text-center">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
          </div>
          <div className="flex gap-3 mt-8">
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              size="lg"
              className="px-7"
            >
              Go Home
            </Button>
            <Button onClick={reset} size="lg" className="px-7">
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
