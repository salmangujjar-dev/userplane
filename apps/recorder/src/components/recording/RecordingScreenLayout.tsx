/**
 * Recording Screen Layout
 * Common layout for all recording screens with branding
 */

import type { ReactNode } from 'react';
import { DEFAULT_COMPANY_NAME } from '@/constants';

interface RecordingScreenLayoutProps {
  children: ReactNode;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
  footnoteText?: string | null;
  /** Optional element to render in top-right corner (e.g., settings dropdown) */
  topRightElement?: ReactNode;
}

export default function RecordingScreenLayout({
  children,
  workspaceLogoUrl,
  workspaceName = DEFAULT_COMPANY_NAME,
  footnoteText,
  topRightElement,
}: RecordingScreenLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Top right settings area */}
      {topRightElement && <div className="absolute top-4 right-4 z-20">{topRightElement}</div>}

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-10">
        <div className="w-full max-w-2xl">{children}</div>
      </div>

      <footer className="flex flex-col items-center gap-2 sm:gap-4 px-4 py-6 sm:py-8 relative z-10">
        <div className="flex items-center gap-2">
          <img
            src={workspaceLogoUrl ?? '/logo-dark.svg'}
            alt={workspaceName ?? DEFAULT_COMPANY_NAME}
            className="h-4 sm:h-5 w-auto object-contain opacity-60"
          />
          <span className="text-xs sm:text-sm font-medium text-gray-600">{workspaceName}</span>
        </div>

        <p className="text-xs text-center text-gray-500 max-w-sm sm:max-w-md px-4 min-h-4">
          {footnoteText || '\u00A0'}
        </p>
      </footer>
    </div>
  );
}
