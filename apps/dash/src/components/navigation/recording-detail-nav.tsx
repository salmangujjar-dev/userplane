'use client';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import Logo from '@workspace/ui/components/logo';
import { Link as LinkIcon, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { useWorkspaceStore } from '@/stores/workspace';

interface RecordingDetailNavProps {
  onCopyLink?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RecordingDetailNav({
  onCopyLink,
  onShare,
  onEdit,
  onDelete,
}: RecordingDetailNavProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return (
    <nav>
      <div className="flex w-full items-center justify-between px-6 py-4">
        <Link href={`/workspace/${workspaceId}/recordings`}>
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default" className="rounded-full" onClick={onCopyLink}>
            <LinkIcon className="h-4 w-4" />
            Copy link
          </Button>
          <Button variant="default" size="default" className="rounded-full" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Recording
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Recording
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
