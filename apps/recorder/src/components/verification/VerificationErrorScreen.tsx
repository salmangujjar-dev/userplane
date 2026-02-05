/**
 * Verification Error Screen
 * Displays error state during domain verification with dino icon
 * Consistent with the recording error screen styling
 */

import { Button } from '@workspace/ui/components/button';

import { DEFAULT_COMPANY_NAME, DEFAULT_PRIMARY_COLOR } from '@/constants';
import { mediaClient } from '@/lib/media';

import VerificationScreenLayout from './VerificationScreenLayout';

interface VerificationErrorScreenProps {
  /** Error title */
  title: string;
  /** Error description */
  subtitle: string;
  /** Workspace logo URL for branding */
  workspaceLogoUrl?: string | null;
  /** Workspace name for branding */
  workspaceName?: string | null;
  /** Primary color for button */
  primaryColor?: string;
  /** Primary action button text (optional) */
  primaryActionText?: string;
  /** Primary action callback (optional - if not provided, no primary button shown) */
  onPrimaryAction?: () => void;
  /** Secondary action text (optional, shown as text link below primary button) */
  secondaryActionText?: string;
  /** Secondary action callback (optional) */
  onSecondaryAction?: () => void;
}

export default function VerificationErrorScreen({
  title,
  subtitle,
  workspaceLogoUrl,
  workspaceName,
  primaryColor = DEFAULT_PRIMARY_COLOR,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}: VerificationErrorScreenProps) {
  return (
    <VerificationScreenLayout
      workspaceLogoUrl={workspaceLogoUrl}
      workspaceName={workspaceName ?? DEFAULT_COMPANY_NAME}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 max-w-md">{subtitle}</p>

        <div className="mb-8">
          <img src={mediaClient.icons.get('dino')} alt="Error" className="w-32 h-32 opacity-80" />
        </div>

        {onPrimaryAction && primaryActionText && (
          <Button
            onClick={onPrimaryAction}
            className="w-full max-w-md h-12 text-base font-semibold text-white"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            {primaryActionText}
          </Button>
        )}

        {onSecondaryAction && secondaryActionText && (
          <button
            onClick={onSecondaryAction}
            className="mt-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </VerificationScreenLayout>
  );
}
