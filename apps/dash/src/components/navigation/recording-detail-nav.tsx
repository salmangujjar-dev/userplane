'use client';

import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import Logo from '@userplane/ui/components/logo';
import { Bot, Link as LinkIcon, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { useWorkspaceStore } from '@/stores/workspace';

interface RecordingDetailNavProps {
  onCopyLink?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onGetAiPrompt?: () => void;
}

export function RecordingDetailNav({
  onCopyLink,
  onShare,
  onEdit,
  onDelete,
  onGetAiPrompt,
}: RecordingDetailNavProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return (
    <nav>
      <div className="flex w-full items-center justify-between px-6 py-4">
        <Link href={`/workspace/${workspaceId}/recordings`}>
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default" onClick={onCopyLink}>
            <LinkIcon className="h-4 w-4" />
            Copy link
          </Button>
          <Button variant="default" size="default" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          {(onEdit || onDelete || onGetAiPrompt) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onGetAiPrompt && (
                  <DropdownMenuItem onClick={onGetAiPrompt}>
                    <Bot className="h-4 w-4 mr-2" />
                    Analyze Issue
                  </DropdownMenuItem>
                )}
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
