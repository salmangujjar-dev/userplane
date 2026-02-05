'use client';

import * as Sentry from '@sentry/nextjs';
import {
  buildErrorTags,
  buildWorkspaceTags,
  type ReactErrorContext,
  type WorkspaceContext,
} from '@workspace/sentry';
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
    const reactCtx: ReactErrorContext = { digest: error.digest };
    const workspaceCtx: WorkspaceContext = { workspace_id: workspaceId || '' };
    Sentry.captureException(error, {
      tags: {
        ...buildErrorTags({ errorBoundary: 'workspace' }),
        ...buildWorkspaceTags({ workspaceId }),
      },
      contexts: {
        react: reactCtx,
        workspace: workspaceCtx,
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
