import { Button } from '@userplane/ui/components/button';
import { Link } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { FieldArrayWithId, FieldErrors } from 'react-hook-form';

import { EmailShareSection } from '../components/email-share-section';

interface ShareLinkViewProps {
  linkLabel: string;
  activeLink: string;
  onCopyLink: () => void;
  canSendEmails: boolean | undefined;
  showEmailShare: boolean;
  fields: FieldArrayWithId<
    { emails: { email: string; isValid: boolean; name?: string }[] },
    'emails',
    'id'
  >[];
  remove: (index: number) => void;
  errors: FieldErrors<{ emails: { email: string; isValid: boolean; name?: string }[] }>;
  emailInput: string;
  setEmailInput: (value: string) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleSelectSuggestion: (email: string, name?: string) => void;
  availableMembers: { workspaceMemberId: string; memberEmail: string; memberName: string }[];
  isLoadingMembers: boolean;
}

export function ShareLinkView({
  linkLabel,
  activeLink,
  onCopyLink,
  canSendEmails,
  showEmailShare,
  fields,
  remove,
  errors,
  emailInput,
  setEmailInput,
  handleKeyDown,
  handleSelectSuggestion,
  availableMembers,
  isLoadingMembers,
}: ShareLinkViewProps) {
  return (
    <>
      {/* Recording Link */}
      <div className="space-y-2">
        <label htmlFor="recording-link" className="text-sm font-medium">
          {linkLabel}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0 rounded-lg bg-muted px-4 py-2.5">
            <input
              id="recording-link"
              type="text"
              value={activeLink}
              readOnly
              className="w-full bg-transparent text-sm focus:outline-none truncate"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full px-4 py-2.5 h-auto"
            onClick={onCopyLink}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email Share Section (gated by sendOutboundEmails) */}
      {canSendEmails && showEmailShare && (
        <EmailShareSection
          fields={fields}
          remove={remove}
          errors={errors}
          emailInput={emailInput}
          setEmailInput={setEmailInput}
          handleKeyDown={handleKeyDown}
          handleSelectSuggestion={handleSelectSuggestion}
          availableMembers={availableMembers}
          isLoadingMembers={isLoadingMembers}
        />
      )}
    </>
  );
}
