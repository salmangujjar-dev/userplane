import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RecordingDetailSkeleton } from '@/components/skeleton';

export const metadata: Metadata = {
  title: 'Shared Recording',
  description: 'View a shared recording',
};

export default function SharedRecordingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col">
          <RecordingDetailSkeleton />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
