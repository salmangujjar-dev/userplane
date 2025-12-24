'use client';

import Image from 'next/image';
import { Button } from '@workspace/ui/components/button';
import { RefreshCw } from 'lucide-react';

interface SectionErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function SectionError({
  title = 'Failed to load',
  description = 'Something went wrong. Please try again.',
  onRetry,
}: SectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed">
      <Image
        src="/assets/dino.svg"
        alt="Error"
        width={64}
        height={64}
        className="mb-4 opacity-50"
      />
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground text-center mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Try again
        </Button>
      )}
    </div>
  );
}
