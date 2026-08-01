import { cn } from '@userplane/ui/lib/utils';
import Avatar from 'boring-avatars';
import { useId } from 'react';

export const AVATAR_SIZES = {
  USER: 32,
  GROUP: 28,
  INLINE: 24,
  TAG: 20,
  COMPACT: 16,
  GROUP_WITH_BORDER: 36,
} as const;

export type AvatarSize = (typeof AVATAR_SIZES)[keyof typeof AVATAR_SIZES];

interface BoringAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
}

function resolveSeed(email?: string | null, name?: string | null): string | null {
  if (name) return name;
  if (email) return email;
  return null;
}

export function BoringAvatar({
  name,
  email,
  size = AVATAR_SIZES.USER,
  className,
}: BoringAvatarProps) {
  // Nothing to seed from; fall back to a per-instance id so the avatar still
  // varies between anonymous entries and stays stable across renders.
  const fallbackSeed = useId();
  const seed = resolveSeed(email, name) ?? fallbackSeed;

  return (
    <div
      className={cn('shrink-0 rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={seed}
        variant="beam"
        colors={['#0f0f0f', '#5597dd', '#2d7dd2', '#f5d547', '#f2f2f2']}
      />
    </div>
  );
}
