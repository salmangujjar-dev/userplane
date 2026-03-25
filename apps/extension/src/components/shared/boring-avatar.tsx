import { cn } from '@userplane/ui/lib/utils';
import Avatar from 'boring-avatars';
import { nanoid } from 'nanoid';
import { useRef } from 'react';

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
  const fallbackRef = useRef<string | null>(null);

  let seed = resolveSeed(email, name);
  if (!seed) {
    if (!fallbackRef.current) {
      fallbackRef.current = nanoid();
    }
    seed = fallbackRef.current;
  }

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
