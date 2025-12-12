'use client';

import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Link as LinkIcon, Share2, ChevronDown } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';

interface RecordingDetailNavProps {
  onCopyLink?: () => void;
  onShareLink?: () => void;
  onShareAtTimestamp?: () => void;
}

export function RecordingDetailNav({
  onCopyLink,
  onShareLink,
  onShareAtTimestamp,
}: RecordingDetailNavProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return (
    <nav>
      <div className="flex w-full items-center justify-between px-6 py-4">
        <Link href={`/${workspaceId}/recordings`}>
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default" className="rounded-full" onClick={onCopyLink}>
            <LinkIcon className="h-4 w-4" />
            Copy link
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="default" className="rounded-full">
                <Share2 className="h-4 w-4" />
                Share
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShareLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShareAtTimestamp}>
                <Share2 className="h-4 w-4 mr-2" />
                Share at 00:00
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
