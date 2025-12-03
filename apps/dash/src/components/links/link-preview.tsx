'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Share2,
  ExternalLink,
  MoreVertical,
  Trash2,
  Pencil,
  Repeat,
  Link2,
  FolderKanban,
} from 'lucide-react';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { EditLinkModal } from '@/components/modals/edit-link-modal';

interface LinkPreviewProps {
  linkId?: string;
  onClick?: () => void;
  title?: string;
  reference?: string;
  createdBy?: string;
  createdAt?: Date;
  projectName?: string;
  isReusable?: boolean;
  onShare?: () => void;
  onView?: () => void;
  onEdit?: (title: string, reference: string, isReusable: boolean) => void;
  onDelete?: () => void;
}

const SAMPLE_TITLES = [
  'Product Demo Recording',
  'Customer Onboarding Session',
  'Bug Reproduction Steps',
  'Feature Walkthrough',
  'User Testing Session',
  'Team Collaboration Recording',
  'Sprint Planning Meeting',
  'Code Review Session',
];

const SAMPLE_CREATORS = [
  'Alice Johnson',
  'Bob Smith',
  'Carol Williams',
  'David Brown',
  'Emma Davis',
  'Frank Miller',
  'Grace Wilson',
  'Henry Moore',
];

const SAMPLE_REFERENCES = [
  'https://github.com/userplane/dashboard/issues/42',
  'https://linear.app/userplane/issue/USR-123',
  'https://app.asana.com/0/1234567890/task',
  'https://userplane.atlassian.net/browse/JIRA-456',
  'https://github.com/vercel/next.js/issues/789',
  'https://app.clickup.com/t/abc123',
  'https://notion.so/userplane/Feature-Request',
  'https://trello.com/c/xyz789/feature-update',
];

export function LinkPreview({
  linkId,
  onClick,
  title,
  reference,
  createdBy,
  createdAt,
  projectName,
  isReusable = false,
  onShare,
  onView,
  onEdit,
  onDelete,
}: LinkPreviewProps) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const getLinkIndex = (id: string) => {
    const match = id.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const linkIndex = linkId ? getLinkIndex(linkId) : 0;
  const displayTitle =
    title || SAMPLE_TITLES[linkIndex % SAMPLE_TITLES.length] || 'Untitled Recording';
  const displayCreator =
    createdBy || SAMPLE_CREATORS[linkIndex % SAMPLE_CREATORS.length] || 'Unknown Creator';
  const displayDate = createdAt || new Date(Date.now() - linkIndex * 86400000 * 2);
  const displayReference =
    reference || SAMPLE_REFERENCES[linkIndex % SAMPLE_REFERENCES.length] || '';

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView();
    } else if (workspaceId) {
      router.push(`/${workspaceId}/recordings`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    } else {
      const shareUrl = `${window.location.origin}/recording/${linkId}`;
      await navigator.clipboard.writeText(shareUrl);
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

  const handleSaveEdit = (title: string, reference: string, reusable: boolean) => {
    if (onEdit) {
      onEdit(title, reference, reusable);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      handleView({ stopPropagation: () => {} } as React.MouseEvent);
    }
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

  return (
    <>
      <div
        className="rounded-xl border border-border hover:border-foreground transition-colors p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium truncate">{displayTitle}</h3>
              {projectName && (
                <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span className="text-xs">{projectName}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <BoringAvatar name={displayCreator} size={20} />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Created by {displayCreator} •</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0">
                      {isReusable ? (
                        <Repeat className="h-3.5 w-3.5" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isReusable ? 'Reusable link' : 'Single-use link'}
                  </TooltipContent>
                </Tooltip>
                <span>{formatDate(displayDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <EditLinkModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={displayTitle}
        reference={displayReference}
        isReusable={isReusable}
        onSave={handleSaveEdit}
      />

      <ShareLinkModal
        link={`${typeof window !== 'undefined' ? window.location.origin : ''}/recording/${linkId}`}
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
