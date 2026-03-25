import { useNavigate } from '@tanstack/react-router';
import type { LinkProviderType } from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import {
  Copy,
  ExternalLink,
  FolderKanban,
  Globe,
  Link2,
  MoreVertical,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { showCopyFailedToast } from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

interface LinkPreviewProps {
  linkId: string;
  linkURL: string;
  title: string | null;
  reference: string | null;
  linkProvider: LinkProviderType | null;
  linkProviderId: string | null;
  createdBy: string;
  createdAt: Date;
  projectName: string | null;
  isReusable: boolean;
  domainUrl: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function LinkPreview({
  linkId,
  linkURL,
  title,
  reference,
  linkProvider,
  linkProviderId,
  createdBy,
  createdAt,
  projectName,
  isReusable,
  domainUrl,
  canDelete = true,
  onDelete,
}: LinkPreviewProps) {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();

  const displayTitle = title || 'Untitled Link';

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (workspaceId) {
      chrome.tabs.create({
        url: `${DASH_URL}/workspace/${workspaceId}/recordings?links=${linkId}`,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(linkURL);
    } catch {
      showCopyFailedToast();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: '/edit',
      search: {
        linkId,
        title: displayTitle,
        reference: reference || '',
        isReusable,
        linkProvider: linkProvider || undefined,
        linkProviderId: linkProviderId || undefined,
      },
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return new Date(date).toLocaleDateString();
  };

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const displayDomain = extractDomain(domainUrl);

  return (
    <div className="rounded-xl border border-border hover:border-foreground transition-colors p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium truncate">{displayTitle}</h3>
            {projectName && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-muted-foreground shrink-0">
                    <FolderKanban className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-xs">{projectName}</span>
                </TooltipContent>
              </Tooltip>
            )}
            {displayDomain && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-muted-foreground shrink-0">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-xs">{displayDomain}</span>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-muted-foreground shrink-0">
                  {isReusable ? (
                    <Repeat className="h-3.5 w-3.5" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs">{isReusable ? 'Reusable link' : 'Single-use link'}</span>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <BoringAvatar name={createdBy} size={AVATAR_SIZES.TAG} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Created by {createdBy}</span>
              <span>&middot;</span>
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleView}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Recordings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
