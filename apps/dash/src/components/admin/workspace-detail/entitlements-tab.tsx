'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { Skeleton } from '@userplane/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@userplane/ui/components/table';
import { MoreVertical, Pencil } from 'lucide-react';
import { useState } from 'react';

import { useAdminUpdateEntitlements, useAdminWorkspaceEntitlements } from '@/features/admin';
import type { AdminEntitlement, AdminUpdateEntitlementItem } from '@/types';

interface EntitlementsTabProps {
  workspaceId: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  seats: 'Seats',
  links: 'Links',
  recordings: 'Recordings',
  screenshots: 'Screenshots',
  files: 'Files',
};

function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : value.toString();
}

interface EditEntitlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entitlement: AdminEntitlement | null;
  onConfirm: (update: AdminUpdateEntitlementItem) => void;
  isPending: boolean;
}

function EditEntitlementModal({
  open,
  onOpenChange,
  entitlement,
  onConfirm,
  isPending,
}: EditEntitlementModalProps) {
  const [quotedLimit, setQuotedLimit] = useState('');
  const [actualLimit, setActualLimit] = useState('');

  // Seed the inputs when the dialog opens or the entitlement changes
  // (adjust state during render)
  const [prevSeed, setPrevSeed] = useState<[boolean, typeof entitlement]>([open, entitlement]);
  if (prevSeed[0] !== open || prevSeed[1] !== entitlement) {
    setPrevSeed([open, entitlement]);
    if (open && entitlement) {
      setQuotedLimit(entitlement.quotedLimit.toString());
      setActualLimit(entitlement.actualLimit.toString());
    }
  }

  const handleConfirm = () => {
    if (!entitlement) return;

    const update: AdminUpdateEntitlementItem = {
      resourceType: entitlement.resourceType as AdminUpdateEntitlementItem['resourceType'],
    };

    const newQuotedLimit = parseInt(quotedLimit, 10);
    const newActualLimit = parseInt(actualLimit, 10);

    if (!isNaN(newQuotedLimit) && newQuotedLimit !== entitlement.quotedLimit) {
      update.quotedLimit = newQuotedLimit;
    }
    if (!isNaN(newActualLimit) && newActualLimit !== entitlement.actualLimit) {
      update.actualLimit = newActualLimit;
    }

    if (update.quotedLimit === undefined && update.actualLimit === undefined) {
      onOpenChange(false);
      return;
    }

    onConfirm(update);
  };

  if (!entitlement) return null;

  const resourceLabel = RESOURCE_LABELS[entitlement.resourceType] || entitlement.resourceType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Edit Entitlement</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update limits for <strong>{resourceLabel}</strong>. Use -1 for unlimited.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quotedLimit" className="mb-2 block">
                Quoted Limit
              </Label>
              <Input
                id="quotedLimit"
                type="number"
                value={quotedLimit}
                onChange={(e) => setQuotedLimit(e.target.value)}
                min={-1}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Advertised limit shown to customers. Use -1 for unlimited.
              </p>
            </div>

            <div>
              <Label htmlFor="actualLimit" className="mb-2 block">
                Actual Limit
              </Label>
              <Input
                id="actualLimit"
                type="number"
                value={actualLimit}
                onChange={(e) => setActualLimit(e.target.value)}
                min={-1}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">Use -1 for unlimited</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" className="px-6" onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EntitlementsTab({ workspaceId }: EntitlementsTabProps) {
  const { data: entitlementsResult, isLoading } = useAdminWorkspaceEntitlements(workspaceId);
  const updateMutation = useAdminUpdateEntitlements();

  const [editingEntitlement, setEditingEntitlement] = useState<AdminEntitlement | null>(null);

  const entitlements: AdminEntitlement[] = entitlementsResult?.success
    ? entitlementsResult.data.entitlements
    : [];

  const handleConfirmEdit = (update: AdminUpdateEntitlementItem) => {
    updateMutation.mutate(
      { workspaceId, entitlements: [update] },
      { onSuccess: () => setEditingEntitlement(null) }
    );
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Entitlements</h2>
        <p className="text-sm text-muted-foreground">
          Manage resource limits for this workspace. Use -1 for unlimited.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">Consumed</TableHead>
                <TableHead className="text-right">Quoted Limit</TableHead>
                <TableHead className="text-right">Actual Limit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entitlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No entitlements found
                  </TableCell>
                </TableRow>
              ) : (
                entitlements.map((entitlement) => (
                  <TableRow key={entitlement.resourceType}>
                    <TableCell className="font-medium">
                      {RESOURCE_LABELS[entitlement.resourceType] || entitlement.resourceType}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{entitlement.resourceConsumed}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{formatLimit(entitlement.quotedLimit)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{formatLimit(entitlement.actualLimit)}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingEntitlement(entitlement)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Limits
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditEntitlementModal
        open={editingEntitlement !== null}
        onOpenChange={(open) => {
          if (!open) setEditingEntitlement(null);
        }}
        entitlement={editingEntitlement}
        onConfirm={handleConfirmEdit}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
