/**
 * Recording Screen Layout
 * Common layout for all recording screens
 */

import type { ReactNode } from 'react';

interface RecordingScreenLayoutProps {
  children: ReactNode;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
}

export default function RecordingScreenLayout({
  children,
  workspaceLogoUrl,
  workspaceName,
}: RecordingScreenLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {workspaceLogoUrl && (
        <div className="mb-8">
          <img
            src={workspaceLogoUrl}
            alt={workspaceName || 'Workspace logo'}
            className="h-12 w-auto"
          />
        </div>
      )}

      <div className="flex flex-col items-center justify-center w-full max-w-2xl">{children}</div>
    </div>
  );
}
