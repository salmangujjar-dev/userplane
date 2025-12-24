'use client';

import Image from 'next/image';
import { Button } from '@workspace/ui/components/button';

interface DinoErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
}

export function DinoError({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = true,
}: DinoErrorProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-3 max-w-md">
        <Image src="/assets/dino.svg" alt="Error" width={120} height={120} className="mb-2" />
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </div>
      <div className="flex gap-3 mt-8">
        {showGoBack && onGoBack && (
          <Button variant="outline" onClick={onGoBack} size="lg" className="rounded-full px-7">
            Go Back
          </Button>
        )}
        {showRetry && onRetry && (
          <Button onClick={onRetry} size="lg" className="rounded-full px-7">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
