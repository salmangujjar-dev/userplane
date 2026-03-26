import { isDefinedError } from '@userplane/client';
import { toast } from '@userplane/ui/components/sonner';

import { getPostHog } from '@/lib/posthog';

interface ORPCDefinedError {
  defined: true;
  code: string;
  status: number;
  message: string;
}

export type SafeResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ORPCDefinedError };

export function handleSafeResult<T>(error: unknown, response: T | null): SafeResult<T> {
  if (error) {
    if (isDefinedError(error)) {
      return { success: false, error };
    }
    console.debug('Unknown API error:', error);
    getPostHog()?.captureException(error, { error_type: 'api_unknown_error' });
    throw error;
  }
  return { success: true, data: response as T };
}

export function showErrorToast(error: ORPCDefinedError): void {
  toast.error(error.message);
}

export function handleUnknownError(error: unknown, fallbackMessage: string): void {
  console.debug(fallbackMessage, error);
  getPostHog()?.captureException(error, {
    error_type: 'unknown_error',
    fallback_message: fallbackMessage,
  });
  toast.error(fallbackMessage, {
    description: error instanceof Error ? error.message : 'An unexpected error occurred',
  });
}
