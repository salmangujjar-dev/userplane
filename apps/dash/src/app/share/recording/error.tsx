'use client';

import { RefreshCw } from 'lucide-react';

import { ErrorView } from '@/components/shared/error-view';

export default function SharedRecordingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      title="Something went wrong"
      description={error.message || 'An unexpected error occurred.'}
      primaryAction={{
        label: 'Try Again',
        icon: <RefreshCw className="h-4 w-4" />,
        onClick: reset,
      }}
    />
  );
}
