/**
 * Error Screen
 * Universal error screen for both pre-recording and post-recording errors
 * Displays title, subtitle, dino icon, and conditional action buttons
 */

import { Button } from '@workspace/ui/components/button';
import Image from 'next/image';

import { DEFAULT_COMPANY_NAME, DEFAULT_PRIMARY_COLOR } from '@/constants';
import { mediaClient } from '@/lib/media';
import type { RecordingPreferences } from '@/types/session-preferences';

import RecordingScreenLayout from './RecordingScreenLayout';

interface ErrorScreenProps {
  /** Error title */
  title: string;
  /** Error description */
  subtitle: string;
  /** Recording preferences for branding */
  preferences?: RecordingPreferences;
  /** Primary action button text (optional) */
  primaryActionText?: string;
  /** Primary action callback (optional - if not provided, no primary button shown) */
  onPrimaryAction?: () => void;
  /** Secondary action text (optional, shown as text link below primary button) */
  secondaryActionText?: string;
  /** Secondary action callback (optional) */
  onSecondaryAction?: () => void;
}

export default function ErrorScreen({
  title,
  subtitle,
  preferences,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}: ErrorScreenProps) {
  const customizeLink = preferences?.customizeLink || false;
  const primaryColor =
    customizeLink && preferences?.primaryColor ? preferences.primaryColor : DEFAULT_PRIMARY_COLOR;

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink && preferences ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink && preferences ? preferences.companyName : DEFAULT_COMPANY_NAME}
      footnoteText={customizeLink && preferences ? preferences.footnoteText : null}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 max-w-md">{subtitle}</p>

        <div className="mb-8">
          <Image
            src={mediaClient.getIconMediaUrl('icons/dino.svg')}
            alt="Error"
            width={128}
            height={128}
            className="w-32 h-32 opacity-80"
          />
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
    </RecordingScreenLayout>
  );
}
