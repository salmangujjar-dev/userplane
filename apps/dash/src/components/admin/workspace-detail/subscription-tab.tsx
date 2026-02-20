'use client';

import type { FeatureGate, PlanId } from '@workspace/pricing';
import { FEATURE_GATE_LABELS, PLAN_NAMES } from '@workspace/pricing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Check, MoreVertical, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  useAdminUpdateEntitlements,
  useAdminWorkspaceEntitlements,
  useAdminWorkspaceSubscription,
} from '@/features/admin';
import type { AdminEntitlement, AdminUpdateEntitlementItem } from '@/types';

interface SubscriptionTabProps {
  workspaceId: string;
}

// ============================================
// HELPERS
// ============================================

function formatDateValue(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPlanDisplayName(planId: string | null): string {
  if (!planId) return 'None';
  if (planId in PLAN_NAMES) return PLAN_NAMES[planId as PlanId];
  return planId;
}

// ============================================
// SECTION A: SUBSCRIPTION OVERVIEW
// ============================================

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface SubscriptionOverviewProps {
  contractDetail: {
    status: string | null;
    planId: string | null;
    planName: string | null;
    currentPeriodStart: Date | string | null;
    currentPeriodEnd: Date | string | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | string | null;
    onHoldSince: Date | string | null;
    trialEnd: Date | string | null;
  };
  accessDetail: {
    effectivePlanId: string;
    accessStatus: string;
  };
  featureGates: Record<string, boolean>;
  addons?: {
    subscriptionId?: string;
    seatsQuantity: number;
    additionalSeats: number;
    addons: Array<{ addonId: string; quantity: number }>;
  };
}

function SubscriptionOverview({
  contractDetail,
  accessDetail,
  featureGates,
  addons,
}: SubscriptionOverviewProps) {
  const gates = Object.entries(featureGates) as [FeatureGate, boolean][];
  const enabledCount = gates.filter(([, enabled]) => enabled).length;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Subscription Overview</h3>
        <p className="text-xs text-muted-foreground">
          Current billing and access status for this workspace.
        </p>
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple">
        {/* Subscription Details */}
        <AccordionItem value="subscription" className="border rounded-lg overflow-hidden px-4 mb-2">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Subscription details</span>
              <span className="text-xs text-muted-foreground">
                {contractDetail.planName ?? getPlanDisplayName(contractDetail.planId)} ·{' '}
                {contractDetail.status ?? 'none'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <DetailRow
                label="Plan"
                value={contractDetail.planName ?? getPlanDisplayName(contractDetail.planId)}
              />
              {accessDetail.effectivePlanId !== contractDetail.planId && (
                <DetailRow
                  label="Effective Plan"
                  value={getPlanDisplayName(accessDetail.effectivePlanId)}
                />
              )}
              <DetailRow label="Status" value={contractDetail.status ?? 'none'} />
              <DetailRow label="Access Status" value={accessDetail.accessStatus} />
              <DetailRow
                label="Billing Period"
                value={`${formatDateValue(contractDetail.currentPeriodStart)} — ${formatDateValue(contractDetail.currentPeriodEnd)}`}
              />
              <DetailRow
                label="Auto-Renew"
                value={contractDetail.cancelAtPeriodEnd ? 'Off' : 'On'}
              />
              {contractDetail.trialEnd && (
                <DetailRow label="Trial Ends" value={formatDateValue(contractDetail.trialEnd)} />
              )}
              {contractDetail.cancelledAt && (
                <DetailRow
                  label="Cancelled At"
                  value={
                    <span>
                      {formatDateValue(contractDetail.cancelledAt)}
                      {contractDetail.cancelAtPeriodEnd && (
                        <span className="text-muted-foreground ml-1">(at period end)</span>
                      )}
                    </span>
                  }
                />
              )}
              {contractDetail.onHoldSince && (
                <DetailRow
                  label="On Hold Since"
                  value={formatDateValue(contractDetail.onHoldSince)}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Feature Gates */}
        <AccordionItem value="features" className="border rounded-lg overflow-hidden px-4 mb-2">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Feature gates</span>
              <span className="text-xs text-muted-foreground">
                {enabledCount} of {gates.length} enabled
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-1">
              {gates.map(([gate, enabled]) => (
                <div key={gate} className="flex items-center justify-between py-0.5">
                  <span className="text-sm">{FEATURE_GATE_LABELS[gate] ?? gate}</span>
                  {enabled ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Add-ons */}
        {addons && (
          <AccordionItem value="addons" className="border rounded-lg overflow-hidden px-4 mb-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Add-ons</span>
                <span className="text-xs text-muted-foreground">
                  {addons.seatsQuantity} seat {addons.seatsQuantity === 1 ? 'pack' : 'packs'} ·{' '}
                  {addons.additionalSeats} additional seats
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-1">
                <DetailRow label="Seat Packs" value={addons.seatsQuantity} />
                <DetailRow label="Additional Seats" value={addons.additionalSeats} />
                {addons.addons.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Add-on Items</p>
                    <div className="space-y-1">
                      {addons.addons.map((addon) => (
                        <div key={addon.addonId} className="flex justify-between text-sm">
                          <span className="font-mono text-xs">{addon.addonId}</span>
                          <span>x{addon.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

// ============================================
// SECTION D: ENTITLEMENTS TABLE (preserved)
// ============================================

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

  useEffect(() => {
    if (open && entitlement) {
      setQuotedLimit(entitlement.quotedLimit.toString());
      setActualLimit(entitlement.actualLimit.toString());
    }
  }, [open, entitlement]);

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
              className="rounded-full px-6"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntitlementsSection({ workspaceId }: { workspaceId: string }) {
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
        <h3 className="text-sm font-semibold">Resource Entitlements</h3>
        <p className="text-xs text-muted-foreground">
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

// ============================================
// MAIN COMPONENT
// ============================================

function SubscriptionSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-40 mb-1" />
      <Skeleton className="h-3 w-64 mb-4" />
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="max-w-md space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SubscriptionTab({ workspaceId }: SubscriptionTabProps) {
  const { data: subscriptionResult, isLoading: isLoadingSubscription } =
    useAdminWorkspaceSubscription(workspaceId);

  const subscription = subscriptionResult?.success ? subscriptionResult.data : null;
  const hasSubscription = subscription && subscription.contractDetail.planId !== null;

  return (
    <div className="space-y-8 max-w-2xl">
      {isLoadingSubscription ? (
        <SubscriptionSkeleton />
      ) : !subscription ? (
        <p className="py-8 text-center text-muted-foreground">No subscription data available</p>
      ) : !hasSubscription ? (
        <p className="py-8 text-center text-muted-foreground">
          This workspace is on the free plan with no active subscription.
        </p>
      ) : (
        <SubscriptionOverview
          contractDetail={subscription.contractDetail}
          accessDetail={subscription.accessDetail}
          featureGates={subscription.featureGates}
          addons={subscription.addons ?? undefined}
        />
      )}

      <EntitlementsSection workspaceId={workspaceId} />
    </div>
  );
}
