/**
 * Verified Screen
 * Shows success message after domain verification completes
 * Handles auto-close after delay
 */

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { DEFAULT_COMPANY_NAME, SUCCESS_AUTO_CLOSE_DELAY_MS } from '@/constants';
import { useAppMode, useVerificationBridge } from '@/contexts/AppModeContext';
import { mediaClient } from '@/lib/media';

import VerificationScreenLayout from './VerificationScreenLayout';

interface VerifiedScreenProps {
  domainUrl: string;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
}

/**
 * Extract clean hostname from URL
 * Handles protocols, paths, query strings, etc.
 * Returns just the hostname (e.g., "example.com", "app.example.com")
 */
function extractHostname(url: string): string {
  try {
    // If URL doesn't have a protocol, add one for parsing
    const urlToParse = url.match(/^https?:\/\//) ? url : `https://${url}`;
    const parsedUrl = new URL(urlToParse);
    return parsedUrl.hostname;
  } catch {
    // Fallback: if URL parsing fails, return the input cleaned up
    return url
      .replace(/^https?:\/\//, '')
      .split('/')[0]!
      .split('?')[0]!
      .split('#')[0]!;
  }
}

export default function VerifiedScreen({
  domainUrl,
  workspaceLogoUrl,
  workspaceName,
}: VerifiedScreenProps) {
  const { isEmbedded, isStandalone } = useAppMode();
  const verificationBridge = useVerificationBridge();
  const cleanupDoneRef = useRef(false);
  const displayUrl = extractHostname(domainUrl);

  // Auto-close after delay
  useEffect(() => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;

    const timer = setTimeout(() => {
      if (isEmbedded && verificationBridge) {
        // Embedded mode: request close via verification bridge (host handles cleanup)
        verificationBridge.requestClose();
      } else if (isStandalone) {
        // Standalone mode: close the tab directly
        window.close();
      }
    }, SUCCESS_AUTO_CLOSE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isEmbedded, isStandalone, verificationBridge]);

  return (
    <VerificationScreenLayout
      workspaceLogoUrl={workspaceLogoUrl}
      workspaceName={workspaceName ?? DEFAULT_COMPANY_NAME}
    >
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <Image
            src={mediaClient.getIconMediaUrl('icons/checkmark.svg')}
            alt="Success"
            width={32}
            height={32}
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Domain verified
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-2 flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <span className="font-medium">{displayUrl}</span> has been successfully verified.
        </p>
        <p className="text-xs sm:text-sm text-gray-500">This window will close automatically</p>
      </div>
    </VerificationScreenLayout>
  );
}
