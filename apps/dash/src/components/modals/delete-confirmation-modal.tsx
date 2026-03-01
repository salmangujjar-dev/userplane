'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'domain' | 'project' | 'recording' | 'link';
  onConfirm: () => void;
  isLoading?: boolean;
  description?: string;
  /**
   * Optional counts to display with consequences
   */
  counts?: {
    recordings?: number;
    links?: number;
  };
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isLoading = false,
  description,
  counts,
}: DeleteConfirmationModalProps) {
  const getItemTypeDisplay = () => {
    return itemType.charAt(0).toUpperCase() + itemType.slice(1);
  };

  const formatCount = (count: number | undefined) => {
    if (count === undefined) return '';
    return count === 0 ? 'no' : count.toString();
  };

  const getConsequences = () => {
    switch (itemType) {
      case 'domain':
        return [
          {
            title: 'Domain Deleted',
            description: `${itemName} will be permanently deleted`,
          },
          {
            title: 'Recordings Lost',
            description:
              counts?.recordings !== undefined
                ? `${formatCount(counts.recordings)} ${counts.recordings === 1 ? 'recording' : 'recordings'} will be permanently deleted`
                : 'All associated recordings will be permanently deleted',
          },
          {
            title: 'Links Removed',
            description:
              counts?.links !== undefined
                ? `${formatCount(counts.links)} ${counts.links === 1 ? 'link' : 'links'} will be permanently deleted`
                : 'All links under this domain will be permanently deleted',
          },
          {
            title: 'Cannot be Undone',
            description: 'This action is permanent and cannot be reversed',
          },
        ];
      case 'project':
        return [
          {
            title: 'Project Deleted',
            description: `${itemName} will be permanently deleted`,
          },
          {
            title: 'Recordings Lost',
            description:
              counts?.recordings !== undefined
                ? `${formatCount(counts.recordings)} ${counts.recordings === 1 ? 'recording' : 'recordings'} will be permanently deleted`
                : 'All project recordings will be permanently deleted',
          },
          {
            title: 'Links Removed',
            description:
              counts?.links !== undefined
                ? `${formatCount(counts.links)} ${counts.links === 1 ? 'link' : 'links'} will be permanently deleted`
                : 'All project links will be permanently deleted',
          },
          {
            title: 'Cannot be Undone',
            description: 'This action is permanent and cannot be reversed',
          },
        ];
      case 'recording':
        return [
          {
            title: 'Recording Deleted',
            description: `${itemName} will be permanently deleted`,
          },
          {
            title: 'Video Content Lost',
            description: 'The recording video and all associated data will be removed',
          },
          {
            title: 'Cannot be Undone',
            description: 'This action is permanent and cannot be reversed',
          },
        ];
      case 'link':
        return [
          {
            title: 'Link Deleted',
            description: `${itemName} will be permanently deleted`,
          },
          {
            title: 'No Longer Accessible',
            description: 'The link will no longer accept new recordings',
          },
          {
            title: 'Existing Recordings Remain',
            description:
              counts?.recordings !== undefined
                ? `${formatCount(counts.recordings)} existing ${counts.recordings === 1 ? 'recording' : 'recordings'} will not be affected`
                : 'Previously created recordings will not be affected',
          },
        ];
      default:
        return [
          {
            title: 'Item Deleted',
            description: 'This item will be permanently deleted',
          },
          {
            title: 'Cannot be Undone',
            description: 'This action is permanent and cannot be reversed',
          },
        ];
    }
  };

  const consequences = getConsequences();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">
                Delete {getItemTypeDisplay()}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {description || `Permanently delete ${itemName}`}
              </DialogDescription>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-2.5">
              {consequences.map((consequence) => (
                <div key={consequence.title} className="flex gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{consequence.title}</p>
                    <p className="text-xs text-muted-foreground">{consequence.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : `Delete ${getItemTypeDisplay()}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
