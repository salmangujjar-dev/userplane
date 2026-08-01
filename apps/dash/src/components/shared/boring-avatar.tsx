import { cn } from '@userplane/ui/lib/utils';
import Avatar from 'boring-avatars';
import { useId } from 'react';

/**
 * Semantic size constants for BoringAvatar.
 * Use these instead of magic numbers to keep sizing consistent.
 */
export const AVATAR_SIZES = {
  /** Primary user avatars in tables, user menus, detail views (32px) */
  USER: 32,
  /** Avatar groups with overlapping borders (28px) */
  GROUP: 28,
  /** Inline metadata and secondary contexts (24px) */
  INLINE: 24,
  /** Email tags and pills (20px) */
  TAG: 20,
  /** Compact suggestions, filters, and tertiary contexts (16px) */
  COMPACT: 16,
  /** Special: workspace member avatars with visible border (36px) */
  GROUP_WITH_BORDER: 36,
} as const;

export type AvatarSize = (typeof AVATAR_SIZES)[keyof typeof AVATAR_SIZES];

/**
 * BoringAvatar - Deterministic avatar generator
 *
 * Generates unique, colorful avatars using the boring-avatars library.
 * Accepts optional name and email -- the component resolves the best seed
 * internally (email > name > stable per-instance id), so callers just pass
 * what they have without worrying about fallback logic.
 *
 * Size is type-locked to AvatarSize to prevent arbitrary pixel values.
 *
 * @example
 * import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
 *
 * // User avatar with email
 * <BoringAvatar size={AVATAR_SIZES.USER} email={member.memberEmail} />
 *
 * // Decorative / placeholder -- unique avatar via per-instance id fallback
 * <BoringAvatar size={AVATAR_SIZES.GROUP} />
 */
interface BoringAvatarProps {
  /** Display name used as avatar seed. Lower priority than email. */
  name?: string | null;
  /** Email used as avatar seed. Preferred over name for uniqueness. */
  email?: string | null;
  /** Avatar size in pixels. Must be one of the AVATAR_SIZES constants. */
  size?: AvatarSize;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Resolve the avatar seed string from props.
 * Priority: name > email > null (caller handles fallback).
 */
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
  // Stable fallback ID per component instance so re-renders
  // do not produce a different avatar when no name/email is provided.
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
