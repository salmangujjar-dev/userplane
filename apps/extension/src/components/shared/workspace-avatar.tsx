import { cn } from '@userplane/ui/lib/utils';
import Avatar from 'boring-avatars';
import { useId } from 'react';

export const WORKSPACE_AVATAR_SIZES = {
  USER: 32,
  GROUP: 28,
  INLINE: 24,
  TAG: 20,
  COMPACT: 16,
} as const;

export type WorkspaceAvatarSize =
  (typeof WORKSPACE_AVATAR_SIZES)[keyof typeof WORKSPACE_AVATAR_SIZES];

interface WorkspaceAvatarProps {
  workspaceId?: string | null;
  workspaceName?: string | null;
  size?: WorkspaceAvatarSize;
  className?: string;
}

export function WorkspaceAvatar({
  workspaceId,
  workspaceName,
  size = WORKSPACE_AVATAR_SIZES.USER,
  className,
}: WorkspaceAvatarProps) {
  // Nothing to seed from; fall back to a per-instance id so the avatar still
  // varies between anonymous entries and stays stable across renders.
  const fallbackSeed = useId();
  const seed = workspaceId || workspaceName || fallbackSeed;

  return (
    <div
      className={cn('shrink-0 rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={seed}
        variant="bauhaus"
        colors={['#0f0f0f', '#5597dd', '#2d7dd2', '#f5d547', '#f2f2f2']}
      />
    </div>
  );
}
