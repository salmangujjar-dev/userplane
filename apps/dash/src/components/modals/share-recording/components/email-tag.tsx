import { AlertCircle, X } from 'lucide-react';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';

interface EmailTagProps {
  email: string;
  isValid: boolean;
  name?: string;
  onRemove: () => void;
}

export function EmailTag({ email, isValid, name, onRemove }: EmailTagProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
        isValid ? 'bg-background' : 'bg-destructive/10 border border-destructive'
      }`}
    >
      {isValid ? (
        <BoringAvatar size={AVATAR_SIZES.TAG} name={name} email={email} />
      ) : (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
      <span className={isValid ? '' : 'text-destructive'}>{email}</span>
      <button type="button" onClick={onRemove} className="hover:bg-muted rounded-sm p-0.5">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
