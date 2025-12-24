'use client';

import { useEffect } from 'react';
import { toast } from '@workspace/ui/components/sonner';
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
