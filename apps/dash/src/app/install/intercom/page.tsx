'use client';

import { SUPPORT_EMAIL_MAILTO } from '@workspace/shared';
import { Suspense, useEffect, useRef, useState } from 'react';

import { apiClient } from '@/client';
import { OAuthErrorState, OAuthLoadingState } from '@/components/integrations/intercom';
import { type DefinedError, handleSafeResult } from '@/lib/errors';
import {
  INTERCOM_INSTALL_SOURCE_APP_STORE,
  INTERCOM_INSTALL_SOURCE_KEY,
} from '@/lib/intercom-install';

function InstallIntercomContent() {
  const [error, setError] = useState<DefinedError | null>(null);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) {
      return;
    }
    hasExecutedRef.current = true;

    const initiateOAuth = async () => {
      try {
        const [apiError, response] = await apiClient.provisioner.intercom.authorize({});
        const result = handleSafeResult(apiError, response?.data ?? null);

        if (!result.success) {
          setError(result.error);
          return;
        }

        sessionStorage.setItem(INTERCOM_INSTALL_SOURCE_KEY, INTERCOM_INSTALL_SOURCE_APP_STORE);
        window.location.href = result.data.authorizationUrl;
      } catch (err) {
        setError({
          defined: true,
          code: 'UNKNOWN_ERROR',
          status: 500,
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      }
    };

    initiateOAuth();
  }, []);

  if (error) {
    return (
      <OAuthErrorState
        error={error}
        errorActionPrimary={{
          label: 'Try Again',
          callback: () => window.location.reload(),
        }}
        errorActionSecondary={{
          label: 'Contact Support',
          callback: () => {
            window.open(SUPPORT_EMAIL_MAILTO, '_blank');
          },
        }}
      />
    );
  }

  return <OAuthLoadingState />;
}

export default function InstallIntercomPage() {
  return (
    <Suspense fallback={<OAuthLoadingState />}>
      <InstallIntercomContent />
    </Suspense>
  );
}
