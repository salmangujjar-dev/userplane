import { MAX_EMAIL_RECIPIENTS } from '@userplane/contract';
import { Skeleton } from '@userplane/ui/components/skeleton';
import type { KeyboardEvent } from 'react';
import type { FieldArrayWithId, FieldErrors } from 'react-hook-form';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';

import { EmailTag } from './email-tag';

interface EmailShareSectionProps {
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

export function EmailShareSection({
  fields,
  remove,
  errors,
  emailInput,
  setEmailInput,
  handleKeyDown,
  handleSelectSuggestion,
  availableMembers,
  isLoadingMembers,
}: EmailShareSectionProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="share-emails" className="text-sm font-medium">
          Email addresses
        </label>
        <div
          className={`w-full rounded-lg bg-muted px-3 py-2 min-h-[100px] focus-within:ring-2 focus-within:ring-ring ${
            errors.emails ? 'border border-destructive' : ''
          }`}
        >
          <div className="flex flex-wrap gap-2 overflow-hidden">
            {fields.map((field, index) => (
              <EmailTag
                key={field.id}
                email={field.email}
                isValid={field.isValid}
                name={field.name}
                onRemove={() => remove(index)}
              />
            ))}
            <input
              id="share-emails"
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={fields.length === 0 ? 'Type email and press space or enter' : ''}
              className="flex-1 min-w-[120px] sm:min-w-[200px] bg-transparent text-sm focus:outline-none py-1"
              disabled={fields.length >= MAX_EMAIL_RECIPIENTS}
            />
          </div>
        </div>
        <div className="h-4 flex items-center justify-between">
          <div>
            {errors.emails?.message && (
              <p className="text-xs text-destructive">{errors.emails.message}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {fields.length}/{MAX_EMAIL_RECIPIENTS}
          </p>
        </div>
      </div>

      {isLoadingMembers ? (
        <div>
          <span className="text-xs text-muted-foreground block mb-2">Workspace members:</span>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </div>
      ) : availableMembers.length > 0 ? (
        <div>
          <span className="text-xs text-muted-foreground block mb-2">Workspace members:</span>
          <div className="flex flex-wrap gap-2">
            {availableMembers.map((m) => (
              <button
                key={m.workspaceMemberId}
                type="button"
                onClick={() => handleSelectSuggestion(m.memberEmail, m.memberName)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <BoringAvatar
                  size={AVATAR_SIZES.COMPACT}
                  name={m.memberName}
                  email={m.memberEmail}
                />
                <span className="truncate max-w-[120px]">{m.memberName || m.memberEmail}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
