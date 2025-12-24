'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/sonner';
import { DinoError } from '@/components/shared/dino-error';
import { logger } from '@/logger';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, 'Workspace error boundary caught error');
    toast.error('Something went wrong', {
      description: error.message || 'An unexpected error occurred',
    });
  }, [error]);

  return (
    <DinoError
      title="Something went wrong"
      description={error.message || 'An unexpected error occurred. Please try again.'}
      onRetry={reset}
      onGoBack={() => router.push('/')}
    />
  );
}
