/**
 * Verifying Screen
 * Shown while domain verification is in progress
 */

import VerificationScreenLayout from './VerificationScreenLayout';

interface VerifyingScreenProps {
  domainUrl?: string;
}

export default function VerifyingScreen({ domainUrl }: VerifyingScreenProps) {
  return (
    <VerificationScreenLayout>
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verifying domain</h1>
        <p className="text-gray-600 text-center">
          {domainUrl ? (
            <>
              Checking ownership of <span className="font-medium">{domainUrl}</span>
            </>
          ) : (
            'This will only take a moment'
          )}
        </p>
      </div>
    </VerificationScreenLayout>
  );
}
