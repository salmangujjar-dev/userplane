'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ADMIN_TRIAL_PERIOD_VALUES,
  AdminPlanBillingCycleSchema,
  type AdminWorkspaceProvisionData,
  DEFAULT_TRIAL_PERIOD_DAYS,
} from '@workspace/contract';
import {
  FEATURE_GATE_KEYS,
  FEATURE_GATE_LABELS,
  type FeatureGate,
  RESOURCE_TYPE_VALUES,
  type ResourceType,
} from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AdminPlanMetadataLine, AdminPlanSummaryRow } from '@/components/admin/plan-display';
import { URLInput } from '@/components/url-input';
import {
  type AdminWorkspaceProvisionMutationInput,
  applyAdminCustomPlanQuickstart,
  cloneAdminCustomPlanGates,
  cloneAdminCustomPlanLimits,
  isCmdKShortcut,
  useAdminPlans,
} from '@/features/admin';
import { showCopiedToClipboardToast, showCopyFailedToast } from '@/lib/toasts';
import { DomainUrlSchema, EmailSchema } from '@/schemas';

// ============================================
// TYPES
// ============================================

type PlanMode = 'none' | 'existing' | 'custom';
type BillingCycle = z.infer<typeof AdminPlanBillingCycleSchema>;
type TrialPeriod = (typeof ADMIN_TRIAL_PERIOD_VALUES)[number];
const DEFAULT_TRIAL_PERIOD = String(DEFAULT_TRIAL_PERIOD_DAYS) as TrialPeriod;

// ============================================
// FORM SCHEMA
// ============================================

const provisionFormSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1, 'Name is required').max(100),
  workspaceDomain: DomainUrlSchema,
  workspaceName: z.string().max(100).optional(),
});

type ProvisionFormData = z.infer<typeof provisionFormSchema>;

// ============================================
// FORM MODAL
// ============================================

interface AdminProvisionWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AdminWorkspaceProvisionMutationInput) => void;
  isPending: boolean;
}

export function AdminProvisionWorkspaceModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AdminProvisionWorkspaceModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [planMode, setPlanMode] = useState<PlanMode>('none');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Trial period state (for existing/custom plan modes)
  const [trialPeriodDays, setTrialPeriodDays] = useState<TrialPeriod>(DEFAULT_TRIAL_PERIOD);

  // Custom plan state
  const [customPriceAmount, setCustomPriceAmount] = useState('');
  const [customBillingCycle, setCustomBillingCycle] = useState<BillingCycle>('monthly');
  const [customLimits, setCustomLimits] = useState<
    Record<ResourceType, { quotedLimit: number; actualLimit: number }>
  >(() => cloneAdminCustomPlanLimits());
  const [customGates, setCustomGates] = useState<Record<FeatureGate, boolean>>(() =>
    cloneAdminCustomPlanGates()
  );

  const { data: plansResult } = useAdminPlans({}, open);
  const plans = plansResult?.success ? plansResult.data.products : [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ProvisionFormData>({
    resolver: zodResolver(provisionFormSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      name: '',
      workspaceDomain: '',
      workspaceName: '',
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setShowAdvanced(false);
      setPlanMode('none');
      setSelectedProductId('');
      setTrialPeriodDays(DEFAULT_TRIAL_PERIOD);
      setCustomPriceAmount('');
      setCustomBillingCycle('monthly');
      setCustomLimits(cloneAdminCustomPlanLimits());
      setCustomGates(cloneAdminCustomPlanGates());
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCmdKShortcut(event)) return;
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) return;
      if (!contentRef.current?.contains(targetNode)) return;

      event.preventDefault();
      const { limits, gates } = applyAdminCustomPlanQuickstart();
      setShowAdvanced(true);
      setPlanMode('custom');
      setSelectedProductId('');
      setCustomLimits(limits);
      setCustomGates(gates);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const updateCustomLimit = (
    rt: ResourceType,
    field: 'quotedLimit' | 'actualLimit',
    value: string
  ) => {
    setCustomLimits((prev) => ({
      ...prev,
      [rt]: { ...prev[rt], [field]: Number(value) || 0 },
    }));
  };

  const canSubmit = () => {
    if (!isValid) return false;
    if (planMode === 'existing' && !selectedProductId) return false;
    if (planMode === 'custom' && !customPriceAmount) return false;
    return true;
  };

  const selectedPlan = plans.find((plan) => plan.productId === selectedProductId) ?? null;

  const onFormSubmit = (data: ProvisionFormData) => {
    const basePayload = {
      email: data.email,
      name: data.name,
      workspaceDomain: data.workspaceDomain,
      workspaceName: data.workspaceName || undefined,
    };

    if (planMode === 'existing' && selectedProductId) {
      const payload: AdminWorkspaceProvisionMutationInput = {
        ...basePayload,
        planMode: 'existing',
        productId: selectedProductId,
        trialPeriodDays,
      };
      onSubmit(payload);
      return;
    }

    if (planMode === 'custom') {
      const payload: AdminWorkspaceProvisionMutationInput = {
        ...basePayload,
        planMode: 'custom',
        trialPeriodDays,
        customPlan: {
          price: {
            amountCents: Math.round((Number(customPriceAmount) || 0) * 100),
            billingCycle: customBillingCycle,
          },
          featureLimits: RESOURCE_TYPE_VALUES.map((rt) => ({
            resourceType: rt,
            ...customLimits[rt],
          })),
          featureGates: FEATURE_GATE_KEYS.map((gate) => ({
            gate,
            enabled: customGates[gate] ?? false,
          })),
        },
      };
      onSubmit(payload);
      return;
    }

    const payload: AdminWorkspaceProvisionMutationInput = {
      ...basePayload,
      planMode: 'free',
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Provision Workspace</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Create a workspace for a sales-led deal with an optional checkout link
                </DialogDescription>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="provision-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Customer email address (creates account if needed)
                  </p>
                </div>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="provision-email"
                      type="email"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="customer@company.com"
                      disabled={isPending}
                      className="rounded-lg"
                    />
                  )}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Name */}
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="provision-name" className="text-sm font-medium">
                    Name
                  </Label>
                  <p className="text-xs text-muted-foreground">Customer display name</p>
                </div>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="provision-name"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Jane Doe"
                      disabled={isPending}
                      className="rounded-lg"
                    />
                  )}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* Workspace Domain */}
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="provision-domain" className="text-sm font-medium">
                    Domain URL
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    The domain URL that will be associated with the workspace
                  </p>
                </div>
                <Controller
                  name="workspaceDomain"
                  control={control}
                  render={({ field }) => (
                    <URLInput
                      id="provision-domain"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="company.com"
                      error={!!errors.workspaceDomain}
                      disabled={isPending}
                    />
                  )}
                />
                {errors.workspaceDomain && (
                  <p className="text-sm text-destructive">{errors.workspaceDomain.message}</p>
                )}
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-5 pt-5 border-t">
                  {/* Workspace Name */}
                  <div className="space-y-2.5">
                    <div className="space-y-0.5">
                      <Label htmlFor="provision-workspace-name" className="text-sm font-medium">
                        Workspace Name
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Optional — derived from domain if empty
                      </p>
                    </div>
                    <Controller
                      name="workspaceName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="provision-workspace-name"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Acme Corp"
                          disabled={isPending}
                          className="rounded-lg"
                        />
                      )}
                    />
                  </div>

                  {/* Plan Mode */}
                  <div className="space-y-2.5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Plan</Label>
                      <p className="text-xs text-muted-foreground">
                        Select a plan for the workspace or skip for free plan
                      </p>
                    </div>
                    <Select
                      value={planMode}
                      onValueChange={(v) => {
                        setPlanMode(v as PlanMode);
                        setSelectedProductId('');
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No plan (free)</SelectItem>
                        <SelectItem value="existing">Existing plan</SelectItem>
                        <SelectItem value="custom">Custom plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Trial Period */}
                  {(planMode === 'existing' || planMode === 'custom') && (
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Trial Period</Label>
                        <p className="text-xs text-muted-foreground">
                          Number of days before billing starts
                        </p>
                      </div>
                      <Select
                        value={trialPeriodDays}
                        onValueChange={(v) => setTrialPeriodDays(v as TrialPeriod)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No trial</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="28">28 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Existing Plan Selector */}
                  {planMode === 'existing' && (
                    <div className="space-y-2.5">
                      <Label className="text-sm font-medium">Select Plan</Label>
                      <Select
                        value={selectedProductId}
                        onValueChange={setSelectedProductId}
                        disabled={isPending}
                      >
                        <SelectTrigger className="rounded-lg">
                          {selectedPlan ? (
                            <div className="w-full min-w-0">
                              <AdminPlanSummaryRow
                                plan={selectedPlan}
                                avatarSize={20}
                                className="gap-2"
                              />
                              <AdminPlanMetadataLine
                                plan={selectedPlan}
                                showMetadataBadge={false}
                                className="pl-7"
                              />
                            </div>
                          ) : (
                            <SelectValue placeholder="Select a plan" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.productId} value={plan.productId}>
                              <div className="w-full min-w-0 py-0.5">
                                <AdminPlanSummaryRow
                                  plan={plan}
                                  avatarSize={20}
                                  className="gap-2"
                                />
                                <AdminPlanMetadataLine
                                  plan={plan}
                                  showMetadataBadge={false}
                                  className="pl-7"
                                />
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Custom Plan Form */}
                  {planMode === 'custom' && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <h4 className="text-sm font-semibold">Custom Plan</h4>

                      {/* Price + Billing Cycle */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="custom-price">Price</Label>
                          <Input
                            id="custom-price"
                            type="number"
                            step="0.01"
                            value={customPriceAmount}
                            onChange={(e) => setCustomPriceAmount(e.target.value)}
                            placeholder="e.g. 99.00"
                            disabled={isPending}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Billing Cycle</Label>
                          <Select
                            value={customBillingCycle}
                            onValueChange={(v) => setCustomBillingCycle(v as BillingCycle)}
                            disabled={isPending}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Feature Limits */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold">Feature Limits</h5>
                        <div className="rounded-lg border">
                          <div className="grid grid-cols-3 gap-2 p-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                            <div>Resource</div>
                            <div>Quoted</div>
                            <div>Actual</div>
                          </div>
                          {RESOURCE_TYPE_VALUES.map((rt) => (
                            <div
                              key={rt}
                              className="grid grid-cols-3 gap-2 p-3 border-b last:border-b-0 items-center"
                            >
                              <div className="text-sm capitalize">{rt}</div>
                              <Input
                                type="number"
                                value={customLimits[rt]?.quotedLimit ?? 0}
                                onChange={(e) =>
                                  updateCustomLimit(rt, 'quotedLimit', e.target.value)
                                }
                                className="h-8 text-xs"
                                disabled={isPending}
                              />
                              <Input
                                type="number"
                                value={customLimits[rt]?.actualLimit ?? 0}
                                onChange={(e) =>
                                  updateCustomLimit(rt, 'actualLimit', e.target.value)
                                }
                                className="h-8 text-xs"
                                disabled={isPending}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Use -1 for unlimited</p>
                      </div>

                      {/* Feature Gates */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold">Feature Gates</h5>
                        <div className="rounded-lg border divide-y">
                          {FEATURE_GATE_KEYS.map((gate) => (
                            <div key={gate} className="flex items-center justify-between p-3">
                              <span className="text-sm">{FEATURE_GATE_LABELS[gate]}</span>
                              <Switch
                                checked={customGates[gate] ?? false}
                                onCheckedChange={(checked) =>
                                  setCustomGates((prev) => ({ ...prev, [gate]: checked }))
                                }
                                disabled={isPending}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="mt-8">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
                disabled={isPending}
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Advanced Options
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Advanced Options
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className="rounded-full px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit() || isPending}
                  className="rounded-full px-6"
                >
                  {isPending ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Provision Workspace
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// SUCCESS MODAL
// ============================================

interface AdminProvisionWorkspaceSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AdminWorkspaceProvisionData | null;
}

export function AdminProvisionWorkspaceSuccessModal({
  open,
  onOpenChange,
  result,
}: AdminProvisionWorkspaceSuccessModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopiedField(null);
      setShowAdvanced(false);
    }
  }, [open]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showCopiedToClipboardToast();
    } catch {
      showCopyFailedToast();
    }
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Workspace Provisioned</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {result.workspaceName} has been created successfully
              </DialogDescription>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Workspace</div>
                <div className="font-medium">{result.workspaceName}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">User</div>
                <div className="font-medium">
                  {result.isNewUser ? 'New user created' : 'Existing user'}
                </div>
              </div>
            </div>

            {/* Checkout URL */}
            {result.checkoutUrl && (
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Checkout URL</Label>
                  <p className="text-xs text-muted-foreground">
                    Share this URL with the customer to complete payment
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={result.checkoutUrl}
                    readOnly
                    className="w-full rounded-lg border bg-muted px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.checkoutUrl!, 'checkout')}
                    className="shrink-0"
                  >
                    {copiedField === 'checkout' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" asChild className="shrink-0">
                    <a href={result.checkoutUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Workspace URL */}
            <div className="space-y-2.5">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Workspace URL</Label>
                <p className="text-xs text-muted-foreground">
                  Direct link to the provisioned workspace
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={result.workspaceUrl}
                  readOnly
                  className="w-full rounded-lg border bg-muted px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(result.workspaceUrl, 'workspace')}
                  className="shrink-0"
                >
                  {copiedField === 'workspace' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" asChild className="shrink-0">
                  <a href={result.workspaceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Advanced Details */}
            {showAdvanced && (
              <div className="space-y-3 pt-5 border-t">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Workspace ID</p>
                  <p className="text-sm font-mono break-all">{result.workspaceId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono break-all">{result.userId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Details
                </>
              )}
            </button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-6"
              >
                Done
              </Button>
              {result.checkoutUrl && (
                <Button
                  onClick={() => handleCopy(result.checkoutUrl!, 'copy-link')}
                  className="rounded-full px-6 w-[140px]"
                >
                  {copiedField === 'copy-link' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
