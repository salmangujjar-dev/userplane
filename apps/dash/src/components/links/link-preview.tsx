'use client';

import type { LinkProviderType } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import {
  ChevronRight,
  ExternalLink,
  FolderKanban,
  Globe,
  Link2,
  MoreVertical,
  Pencil,
  Repeat,
  Share2,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { EditLinkModal } from '@/components/modals/edit-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { logger } from '@/logger';
import { useWorkspaceStore } from '@/stores/workspace';

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
  onShare?: () => void;
  onView?: () => void;
  onEdit?: (title: string, reference: string, isReusable: boolean) => void;
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
  onShare,
  onView,
  onEdit,
  onDelete,
}: LinkPreviewProps) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const displayTitle = title || 'Untitled Link';

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView();
    } else if (workspaceId) {
      router.push(`/workspace/${workspaceId}/recordings?links=${linkId}`);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleSaveEdit = (
    title: string,
    reference: string,
    reusable: boolean,
    linkProvider?: string,
    linkProviderId?: string
  ) => {
    if (onEdit) {
      onEdit(title, reference, reusable);
    }
    logger.debug({ linkProvider, linkProviderId }, 'Fetched link provider and ID');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
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
    <>
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
                  <span className="text-xs">
                    {isReusable ? 'Reusable link' : 'Single-use link'}
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <BoringAvatar name={createdBy} size={AVATAR_SIZES.TAG} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Created by {createdBy}</span>
                <span>•</span>
                <span>{formatDate(createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
              onClick={handleView}
            >
              Recordings
              <ChevronRight className="h-4 w-4" />
            </Button>
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
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleView}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
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

      <EditLinkModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={displayTitle}
        reference={reference || ''}
        isReusable={isReusable}
        linkProvider={linkProvider || undefined}
        linkProviderId={linkProviderId || undefined}
        onSave={handleSaveEdit}
      />

      <ShareLinkModal
        link={linkURL}
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
