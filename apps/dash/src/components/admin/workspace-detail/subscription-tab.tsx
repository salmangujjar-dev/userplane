'use client';

import type {
  FeatureGate,
  PlanFeatureGates,
  PlanId,
  ResourceLimits,
  ResourceType,
} from '@workspace/pricing';
import { FEATURE_GATE_LABELS, PLAN_NAMES, RESOURCE_TYPE_VALUES } from '@workspace/pricing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Switch } from '@workspace/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { useCallback, useMemo, useState } from 'react';

import {
  useAdminUpdateSubscription,
  useAdminWorkspaceEntitlements,
  useAdminWorkspaceSubscription,
} from '@/features/admin';
import type { AdminEntitlement } from '@/types';

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
  workspaceId: string;
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
  featureGates: PlanFeatureGates;
  addons?: {
    subscriptionId?: string;
    seatsQuantity: number;
    additionalSeats: number;
    addons: Array<{ addonId: string; quantity: number }>;
  };
}

function SubscriptionOverview({
  workspaceId,
  contractDetail,
  accessDetail,
  featureGates,
  addons,
}: SubscriptionOverviewProps) {
  const gates = Object.entries(featureGates) as [FeatureGate, boolean][];
  const enabledCount = gates.filter(([, enabled]) => enabled).length;

  // Fetch current entitlements for pre-populating feature limits
  const { data: entitlementsResult } = useAdminWorkspaceEntitlements(workspaceId);

  // Build a lookup of current limits by resource type
  const currentLimitsMap = useMemo(() => {
    const entitlements = entitlementsResult?.success ? entitlementsResult.data.entitlements : [];
    const map: Partial<Record<ResourceType, { quotedLimit: number; actualLimit: number }>> = {};
    for (const e of entitlements) {
      map[e.resourceType as ResourceType] = {
        quotedLimit: e.quotedLimit,
        actualLimit: e.actualLimit,
      };
    }
    return map;
  }, [entitlementsResult]);

  // Track local overrides for editing (gates + limits)
  const [localGates, setLocalGates] = useState<Partial<PlanFeatureGates>>({});
  const [localLimits, setLocalLimits] = useState<
    Partial<Record<ResourceType, Partial<ResourceLimits>>>
  >({});
  const updateSubscriptionMutation = useAdminUpdateSubscription();

  // Compute whether there are pending changes
  const hasChanges = useMemo(
    () => Object.keys(localGates).length > 0 || Object.keys(localLimits).length > 0,
    [localGates, localLimits]
  );

  const handleGateToggle = useCallback(
    (gate: FeatureGate, checked: boolean) => {
      setLocalGates((prev) => {
        const originalValue = featureGates[gate];
        if (checked === originalValue) {
          const next = { ...prev };
          delete next[gate];
          return next;
        }
        return { ...prev, [gate]: checked };
      });
    },
    [featureGates]
  );

  const handleLimitChange = useCallback(
    (
      resourceType: ResourceType,
      field: 'quotedLimit' | 'actualLimit',
      value: string,
      originalValue: number
    ) => {
      const parsed = parseInt(value, 10);
      setLocalLimits((prev) => {
        const existing = prev[resourceType] ?? {};
        if (!isNaN(parsed) && parsed === originalValue) {
          // Reverted to original — remove this field override
          const updated = { ...existing };
          delete updated[field];
          if (Object.keys(updated).length === 0) {
            const next = { ...prev };
            delete next[resourceType];
            return next;
          }
          return { ...prev, [resourceType]: updated };
        }
        return {
          ...prev,
          [resourceType]: { ...existing, [field]: isNaN(parsed) ? undefined : parsed },
        };
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!hasChanges) return;
    updateSubscriptionMutation.mutate(
      {
        workspaceId,
        featureGates: Object.keys(localGates).length > 0 ? localGates : undefined,
        entitlements: Object.keys(localLimits).length > 0 ? localLimits : undefined,
      },
      {
        onSuccess: () => {
          setLocalGates({});
          setLocalLimits({});
        },
      }
    );
  }, [workspaceId, localGates, localLimits, hasChanges, updateSubscriptionMutation]);

  const handleDiscard = useCallback(() => {
    setLocalGates({});
    setLocalLimits({});
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Subscription Overview</h3>
        <p className="text-xs text-muted-foreground">
          Current billing and access status for this workspace.
        </p>
      </div>

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

        {/* Entitlements — feature gates + feature limits, single save to DodoPayments */}
        <AccordionItem value="entitlements" className="border rounded-lg overflow-hidden px-4 mb-2">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Entitlements</span>
              <span className="text-xs text-muted-foreground">
                {enabledCount} of {gates.length} gates enabled
                {hasChanges && ' · unsaved changes'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {/* Feature Gates sub-section */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Feature Gates</p>
              <div className="space-y-2">
                {gates.map(([gate, enabled]) => {
                  const effectiveValue = localGates[gate] ?? enabled;
                  const isOverridden = gate in localGates;
                  return (
                    <div key={gate} className="flex items-center justify-between py-0.5">
                      <span className={`text-sm ${isOverridden ? 'font-medium' : ''}`}>
                        {FEATURE_GATE_LABELS[gate] ?? gate}
                      </span>
                      <Switch
                        checked={effectiveValue}
                        onCheckedChange={(checked) => handleGateToggle(gate, checked)}
                        disabled={updateSubscriptionMutation.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Limits sub-section */}
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Feature Limits</p>
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-xs text-muted-foreground mb-1">
                  <span>Resource</span>
                  <span className="w-28 text-center">Quoted Limit</span>
                  <span className="w-28 text-center">Actual Limit</span>
                </div>
                {RESOURCE_TYPE_VALUES.map((resourceType) => {
                  const current = currentLimitsMap[resourceType];
                  const localOverride = localLimits[resourceType];
                  const quotedValue = localOverride?.quotedLimit ?? current?.quotedLimit;
                  const actualValue = localOverride?.actualLimit ?? current?.actualLimit;
                  return (
                    <div
                      key={resourceType}
                      className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
                    >
                      <span className="text-sm">
                        {RESOURCE_LABELS[resourceType] ?? resourceType}
                      </span>
                      <Input
                        type="number"
                        min={-1}
                        placeholder="—"
                        className="h-8 text-sm w-28"
                        value={quotedValue ?? ''}
                        onChange={(e) =>
                          handleLimitChange(
                            resourceType,
                            'quotedLimit',
                            e.target.value,
                            current?.quotedLimit ?? NaN
                          )
                        }
                        disabled={updateSubscriptionMutation.isPending}
                      />
                      <Input
                        type="number"
                        min={-1}
                        placeholder="—"
                        className="h-8 text-sm w-28"
                        value={actualValue ?? ''}
                        onChange={(e) =>
                          handleLimitChange(
                            resourceType,
                            'actualLimit',
                            e.target.value,
                            current?.actualLimit ?? NaN
                          )
                        }
                        disabled={updateSubscriptionMutation.isPending}
                      />
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Use -1 for unlimited. Changes are synced via DodoPayments.
                </p>
              </div>
            </div>

            {/* Unified save/discard */}
            {hasChanges && (
              <div className="flex gap-2 justify-end pt-3 border-t mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={handleDiscard}
                  disabled={updateSubscriptionMutation.isPending}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  className="rounded-full px-4"
                  onClick={handleSave}
                  disabled={updateSubscriptionMutation.isPending}
                >
                  {updateSubscriptionMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
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
// SECTION B: RESOURCE USAGE TABLE (read-only)
// ============================================

function ResourceUsageSection({ workspaceId }: { workspaceId: string }) {
  const { data: entitlementsResult, isLoading } = useAdminWorkspaceEntitlements(workspaceId);

  const entitlements: AdminEntitlement[] = entitlementsResult?.success
    ? entitlementsResult.data.entitlements
    : [];

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Resource Usage</h3>
        <p className="text-xs text-muted-foreground">
          Current resource consumption and limits. Limits are managed via the Entitlements section
          above.
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
                  </TableRow>
                ))
              ) : entitlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
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
          workspaceId={workspaceId}
          contractDetail={subscription.contractDetail}
          accessDetail={subscription.accessDetail}
          featureGates={subscription.featureGates}
          addons={subscription.addons ?? undefined}
        />
      )}

      <ResourceUsageSection workspaceId={workspaceId} />
    </div>
  );
}
