import { isDefinedError } from '@userplane/client';
import { toast } from '@userplane/ui/components/sonner';

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
    console.error('Unknown API error:', error);
    throw error;
  }
  return { success: true, data: response as T };
}

export function showErrorToast(error: ORPCDefinedError): void {
  toast.error(error.message);
}

export function handleUnknownError(error: unknown, fallbackMessage: string): void {
  console.error(fallbackMessage, error);
  toast.error(fallbackMessage, {
    description: error instanceof Error ? error.message : 'An unexpected error occurred',
  });
}
