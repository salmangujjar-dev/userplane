'use client';

import { useState } from 'react';

export function AppearanceSection() {
  const [workspaceSlug, setWorkspaceSlug] = useState('larys-workspace');

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setWorkspaceSlug(value);
  };

  return (
    <div>
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recording URL</h2>
            <p className="text-sm text-muted-foreground">
              This is your recording URL. Only lowercase letters, numbers, and hyphens are allowed.
            </p>
          </div>
          <div className="relative">
            <div className="relative rounded-lg border border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-50 px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-zinc-200 text-sm">
                <svg
                  className="h-4 w-4 text-zinc-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-zinc-500 flex-shrink-0">recorder.userplane.io/r/</span>
                  <input
                    id="workspace-slug"
                    value={workspaceSlug}
                    onChange={handleSlugChange}
                    placeholder="your-slug"
                    className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 font-semibold text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
