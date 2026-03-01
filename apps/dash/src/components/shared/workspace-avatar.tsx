import { cn } from '@userplane/ui/lib/utils';
import Avatar from 'boring-avatars';
import { nanoid } from 'nanoid';
import { useRef } from 'react';

export const WORKSPACE_AVATAR_SIZES = {
  USER: 32,
  GROUP: 28,
  INLINE: 24,
  TAG: 20,
  COMPACT: 16,
  GROUP_WITH_BORDER: 36,
} as const;

export type WorkspaceAvatarSize =
  (typeof WORKSPACE_AVATAR_SIZES)[keyof typeof WORKSPACE_AVATAR_SIZES];

interface WorkspaceAvatarProps {
  workspaceId?: string | null;
  workspaceName?: string | null;
  size?: WorkspaceAvatarSize;
  className?: string;
}

function resolveWorkspaceSeed(
  workspaceId?: string | null,
  workspaceName?: string | null
): string | null {
  if (workspaceId) return workspaceId;
  if (workspaceName) return workspaceName;
  return null;
}

export function WorkspaceAvatar({
  workspaceId,
  workspaceName,
  size = WORKSPACE_AVATAR_SIZES.USER,
  className,
}: WorkspaceAvatarProps) {
  const fallbackRef = useRef<string | null>(null);

  let seed = resolveWorkspaceSeed(workspaceId, workspaceName);
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
        variant="bauhaus"
        colors={['#0f0f0f', '#5597dd', '#2d7dd2', '#f5d547', '#f2f2f2']}
      />
    </div>
  );
}
