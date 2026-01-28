'use client';

import * as Sentry from '@sentry/nextjs';
import { toast } from '@workspace/ui/components/sonner';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
  const params = useParams();
  const workspaceId = params?.workspaceId as string | undefined;

  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, 'Workspace error boundary caught error');

    // Capture error in Sentry with workspace context
    Sentry.captureException(error, {
      tags: {
        error_boundary: 'workspace',
        workspace_id: workspaceId,
      },
      contexts: {
        react: {
          digest: error.digest,
        },
        workspace: {
          workspaceId,
        },
      },
    });

    toast.error('Something went wrong', {
      description: error.message || 'An unexpected error occurred',
    });
  }, [error, workspaceId]);

  return (
    <DinoError
      title="Something went wrong"
      description={error.message || 'An unexpected error occurred. Please try again.'}
      onRetry={reset}
      onGoBack={() => router.push('/')}
    />
  );
}
