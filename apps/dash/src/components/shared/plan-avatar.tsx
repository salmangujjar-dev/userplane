import { cn } from '@userplane/ui/lib/utils';
import Avatar from 'boring-avatars';
import { useId } from 'react';

export const PLAN_AVATAR_SIZES = {
  USER: 32,
  GROUP: 28,
  INLINE: 24,
  TAG: 20,
  COMPACT: 16,
  GROUP_WITH_BORDER: 36,
} as const;

export type PlanAvatarSize = (typeof PLAN_AVATAR_SIZES)[keyof typeof PLAN_AVATAR_SIZES];

interface PlanAvatarProps {
  productId?: string | null;
  planName?: string | null;
  size?: PlanAvatarSize;
  className?: string;
}

function resolvePlanSeed(productId?: string | null, planName?: string | null): string | null {
  if (productId) return productId;
  if (planName) return planName;
  return null;
}

export function PlanAvatar({
  productId,
  planName,
  size = PLAN_AVATAR_SIZES.USER,
  className,
}: PlanAvatarProps) {
  // Nothing to seed from; fall back to a per-instance id so the avatar still
  // varies between anonymous entries and stays stable across renders.
  const fallbackSeed = useId();
  const seed = resolvePlanSeed(productId, planName) ?? fallbackSeed;

  return (
    <div
      className={cn('shrink-0 rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={seed}
        variant="marble"
        colors={['#0f0f0f', '#5597dd', '#2d7dd2', '#f5d547', '#f2f2f2']}
      />
    </div>
  );
}
