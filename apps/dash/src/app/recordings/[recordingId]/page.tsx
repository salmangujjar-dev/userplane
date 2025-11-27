'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';

export default function RecordingDetailPage() {
  return (
    <div className="min-h-svh bg-background">
      <nav>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="default" className="rounded-lg">
              Share
            </Button>
            <Button variant="default" size="default" className="rounded-lg">
              Download
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full aspect-video rounded-2xl bg-muted" />

            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded-lg bg-muted" />
              <div className="h-4 w-1/4 rounded-lg bg-muted" />
            </div>

            <div className="w-full h-64 rounded-2xl bg-muted" />
          </div>

          <div className="lg:col-span-1">
            <div className="w-full h-full rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    </div>
  );
}
