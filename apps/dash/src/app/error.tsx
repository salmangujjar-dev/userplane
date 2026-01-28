'use client';

import * as Sentry from '@sentry/nextjs';
import { toast } from '@workspace/ui/components/sonner';
import { useEffect } from 'react';

import { DinoError } from '@/components/shared/dino-error';
import { logger } from '@/logger';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, 'App error boundary caught error');

    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        error_boundary: 'app',
      },
      contexts: {
        react: {
          digest: error.digest,
        },
      },
    });

    toast.error('Something went wrong', {
      description: error.message || 'An unexpected error occurred',
    });
  }, [error]);

  return (
    <DinoError
      title="Something went wrong"
      description={error.message || 'An unexpected error occurred. Please try again.'}
      onRetry={reset}
      onGoBack={() => (window.location.href = '/')}
    />
  );
}
