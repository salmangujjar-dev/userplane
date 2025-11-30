'use client';

import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace';

interface LinkPreviewProps {
  linkId?: string;
  onClick?: () => void;
}

export function LinkPreview({ onClick }: LinkPreviewProps) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (workspaceId) {
      router.push(`/${workspaceId}/recordings`);
    }
  };

  return (
    <div
      className="h-20 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={handleClick}
    />
  );
}
