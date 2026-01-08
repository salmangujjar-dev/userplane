/**
 * Verification Screen Layout
 * Common layout for all verification screens with branding
 * Styled consistent with RecordingScreenLayout
 */

import type { ReactNode } from 'react';
import { DEFAULT_COMPANY_NAME } from '@/constants';

interface VerificationScreenLayoutProps {
  children: ReactNode;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
  footnoteText?: string | null;
}

export default function VerificationScreenLayout({
  children,
  workspaceLogoUrl,
  workspaceName = DEFAULT_COMPANY_NAME,
  footnoteText,
}: VerificationScreenLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Decorative icons - Desktop Left Side */}
      <div className="absolute left-0 top-0 h-full w-32 hidden lg:block">
        <img
          src="/tile/bubble.png"
          alt=""
          width="80"
          height="80"
          className="absolute top-[18%] -left-6 rotate-[-15deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <img
          src="/tile/fin.png"
          alt=""
          width="90"
          height="90"
          className="absolute top-[38%] -left-8 rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <img
          src="/tile/letterbox.png"
          alt=""
          width="85"
          height="85"
          className="absolute top-[58%] -left-7 rotate-[-8deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <img
          src="/tile/paperplane.png"
          alt=""
          width="75"
          height="75"
          className="absolute top-[78%] -left-5 rotate-18 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      {/* Decorative icons - Desktop Right Side */}
      <div className="absolute right-0 top-0 h-full w-32 hidden lg:block">
        <img
          src="/tile/intercom.png"
          alt=""
          width="85"
          height="85"
          className="absolute top-[17%] -right-7 rotate-10 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <img
          src="/tile/browsercursor.png"
          alt=""
          width="75"
          height="75"
          className="absolute top-[38%] -right-5 rotate-[-14deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <img
          src="/tile/magf.png"
          alt=""
          width="80"
          height="80"
          className="absolute top-[59%] -right-6 rotate-[-10deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <img
          src="/tile/documentation.png"
          alt=""
          width="85"
          height="85"
          className="absolute top-[80%] -right-7 rotate-13 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

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
