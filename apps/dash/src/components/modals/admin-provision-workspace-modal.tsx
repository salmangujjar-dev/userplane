'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ADMIN_TRIAL_PERIOD_VALUES,
  AdminPlanBillingCycleSchema,
  type AdminWorkspaceProvisionData,
  DEFAULT_TRIAL_PERIOD_DAYS,
} from '@userplane/contract';
import {
  FEATURE_GATE_KEYS,
  FEATURE_GATE_LABELS,
  type FeatureGate,
  RESOURCE_TYPE_VALUES,
  type ResourceType,
} from '@userplane/pricing';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
import { Switch } from '@userplane/ui/components/switch';
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Zap } from 'lucide-react';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AdminPlanMetadataLine, AdminPlanSummaryRow } from '@/components/admin/plan-display';
import { URLInput } from '@/components/url-input';
import {
  type AdminCustomPlanGates,
  type AdminCustomPlanLimits,
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
// PROVISION FORM REDUCER
// ============================================

interface ProvisionFormState {
  showAdvanced: boolean;
  planMode: PlanMode;
  selectedProductId: string;
  trialPeriodDays: TrialPeriod;
  customPriceAmount: string;
  customBillingCycle: BillingCycle;
  customLimits: AdminCustomPlanLimits;
  customGates: AdminCustomPlanGates;
}

type ProvisionFormAction =
  | { type: 'SET_SHOW_ADVANCED'; value: boolean }
  | { type: 'SET_PLAN_MODE'; value: PlanMode }
  | { type: 'SET_SELECTED_PRODUCT'; value: string }
  | { type: 'SET_TRIAL_PERIOD'; value: TrialPeriod }
  | { type: 'SET_CUSTOM_PRICE'; value: string }
  | { type: 'SET_BILLING_CYCLE'; value: BillingCycle }
  | {
      type: 'UPDATE_CUSTOM_LIMIT';
      rt: ResourceType;
      field: 'quotedLimit' | 'actualLimit';
      value: number;
    }
  | { type: 'SET_CUSTOM_GATE'; gate: FeatureGate; enabled: boolean }
  | { type: 'QUICKSTART'; limits: AdminCustomPlanLimits; gates: AdminCustomPlanGates }
  | { type: 'RESET' };

function createInitialProvisionFormState(): ProvisionFormState {
  return {
    showAdvanced: false,
    planMode: 'none',
    selectedProductId: '',
    trialPeriodDays: DEFAULT_TRIAL_PERIOD,
    customPriceAmount: '',
    customBillingCycle: 'monthly',
    customLimits: cloneAdminCustomPlanLimits(),
    customGates: cloneAdminCustomPlanGates(),
  };
}

function provisionFormReducer(
  state: ProvisionFormState,
  action: ProvisionFormAction
): ProvisionFormState {
  switch (action.type) {
    case 'SET_SHOW_ADVANCED':
      return { ...state, showAdvanced: action.value };
    case 'SET_PLAN_MODE':
      return { ...state, planMode: action.value, selectedProductId: '' };
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProductId: action.value };
    case 'SET_TRIAL_PERIOD':
      return { ...state, trialPeriodDays: action.value };
    case 'SET_CUSTOM_PRICE':
      return { ...state, customPriceAmount: action.value };
    case 'SET_BILLING_CYCLE':
      return { ...state, customBillingCycle: action.value };
    case 'UPDATE_CUSTOM_LIMIT':
      return {
        ...state,
        customLimits: {
          ...state.customLimits,
          [action.rt]: {
            ...state.customLimits[action.rt],
            [action.field]: action.value,
          },
        },
      };
    case 'SET_CUSTOM_GATE':
      return {
        ...state,
        customGates: { ...state.customGates, [action.gate]: action.enabled },
      };
    case 'QUICKSTART':
      return {
        ...state,
        showAdvanced: true,
        planMode: 'custom',
        selectedProductId: '',
        customLimits: action.limits,
        customGates: action.gates,
      };
    case 'RESET':
      return createInitialProvisionFormState();
  }
}

// ============================================
// EXTRACTED SUB-COMPONENTS
// ============================================

interface ProvisionBasicFieldsProps {
  control: ReturnType<typeof useForm<ProvisionFormData>>['control'];
  errors: ReturnType<typeof useForm<ProvisionFormData>>['formState']['errors'];
  isPending: boolean;
}

function ProvisionBasicFields({ control, errors, isPending }: ProvisionBasicFieldsProps) {
  return (
    <>
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
    </>
  );
}

interface PlanModeSelectorProps {
  planMode: PlanMode;
  onPlanModeChange: (mode: PlanMode) => void;
  isPending: boolean;
}

function PlanModeSelector({ planMode, onPlanModeChange, isPending }: PlanModeSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">Plan</Label>
        <p className="text-xs text-muted-foreground">
          Select a plan for the workspace or skip for free plan
        </p>
      </div>
      <Select
        value={planMode}
        onValueChange={(v) => onPlanModeChange(v as PlanMode)}
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
  );
}

interface TrialPeriodSelectorProps {
  trialPeriodDays: TrialPeriod;
  onTrialPeriodChange: (period: TrialPeriod) => void;
  isPending: boolean;
}

function TrialPeriodSelector({
  trialPeriodDays,
  onTrialPeriodChange,
  isPending,
}: TrialPeriodSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">Trial Period</Label>
        <p className="text-xs text-muted-foreground">Number of days before billing starts</p>
      </div>
      <Select
        value={trialPeriodDays}
        onValueChange={(v) => onTrialPeriodChange(v as TrialPeriod)}
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
  );
}

interface ExistingPlanSelectorProps {
  selectedProductId: string;
  onProductChange: (productId: string) => void;
  plans: ReturnType<typeof useAdminPlans>['data'] extends infer R
    ? R extends { success: true; data: { products: infer P } }
      ? P extends (infer U)[]
        ? U[]
        : never
      : never
    : never;
  selectedPlan: ExistingPlanSelectorProps['plans'][number] | null;
  isPending: boolean;
}

function ExistingPlanSelector({
  selectedProductId,
  onProductChange,
  plans,
  selectedPlan,
  isPending,
}: ExistingPlanSelectorProps) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium">Select Plan</Label>
      <Select value={selectedProductId} onValueChange={onProductChange} disabled={isPending}>
        <SelectTrigger className="rounded-lg">
          {selectedPlan ? (
            <div className="w-full min-w-0">
              <AdminPlanSummaryRow plan={selectedPlan} avatarSize={20} className="gap-2" />
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
                <AdminPlanSummaryRow plan={plan} avatarSize={20} className="gap-2" />
                <AdminPlanMetadataLine plan={plan} showMetadataBadge={false} className="pl-7" />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FeatureLimitsTableProps {
  customLimits: AdminCustomPlanLimits;
  onUpdateLimit: (rt: ResourceType, field: 'quotedLimit' | 'actualLimit', value: number) => void;
  isPending: boolean;
}

function FeatureLimitsTable({ customLimits, onUpdateLimit, isPending }: FeatureLimitsTableProps) {
  return (
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
              onChange={(e) => onUpdateLimit(rt, 'quotedLimit', Number(e.target.value) || 0)}
              className="h-8 text-xs"
              disabled={isPending}
            />
            <Input
              type="number"
              value={customLimits[rt]?.actualLimit ?? 0}
              onChange={(e) => onUpdateLimit(rt, 'actualLimit', Number(e.target.value) || 0)}
              className="h-8 text-xs"
              disabled={isPending}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Use -1 for unlimited</p>
    </div>
  );
}

interface FeatureGatesListProps {
  customGates: AdminCustomPlanGates;
  onSetGate: (gate: FeatureGate, enabled: boolean) => void;
  isPending: boolean;
}

function FeatureGatesList({ customGates, onSetGate, isPending }: FeatureGatesListProps) {
  return (
    <div className="space-y-2">
      <h5 className="text-sm font-semibold">Feature Gates</h5>
      <div className="rounded-lg border divide-y">
        {FEATURE_GATE_KEYS.map((gate) => (
          <div key={gate} className="flex items-center justify-between p-3">
            <span className="text-sm">{FEATURE_GATE_LABELS[gate]}</span>
            <Switch
              checked={customGates[gate] ?? false}
              onCheckedChange={(checked) => onSetGate(gate, checked)}
              disabled={isPending}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface CustomPlanFormProps {
  customPriceAmount: string;
  customBillingCycle: BillingCycle;
  customLimits: AdminCustomPlanLimits;
  customGates: AdminCustomPlanGates;
  dispatch: React.Dispatch<ProvisionFormAction>;
  isPending: boolean;
}

function CustomPlanForm({
  customPriceAmount,
  customBillingCycle,
  customLimits,
  customGates,
  dispatch,
  isPending,
}: CustomPlanFormProps) {
  return (
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
            onChange={(e) => dispatch({ type: 'SET_CUSTOM_PRICE', value: e.target.value })}
            placeholder="e.g. 99.00"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Billing Cycle</Label>
          <Select
            value={customBillingCycle}
            onValueChange={(v) => dispatch({ type: 'SET_BILLING_CYCLE', value: v as BillingCycle })}
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

      <FeatureLimitsTable
        customLimits={customLimits}
        onUpdateLimit={(rt, field, value) =>
          dispatch({ type: 'UPDATE_CUSTOM_LIMIT', rt, field, value })
        }
        isPending={isPending}
      />

      <FeatureGatesList
        customGates={customGates}
        onSetGate={(gate, enabled) => dispatch({ type: 'SET_CUSTOM_GATE', gate, enabled })}
        isPending={isPending}
      />
    </div>
  );
}

interface ProvisionSuccessContentProps {
  result: AdminWorkspaceProvisionData;
  copiedField: string | null;
  showAdvanced: boolean;
  onCopy: (text: string, field: string) => void;
}

function ProvisionSuccessContent({
  result,
  copiedField,
  showAdvanced,
  onCopy,
}: ProvisionSuccessContentProps) {
  return (
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
              onClick={() => onCopy(result.checkoutUrl!, 'checkout')}
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
          <p className="text-xs text-muted-foreground">Direct link to the provisioned workspace</p>
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
            onClick={() => onCopy(result.workspaceUrl, 'workspace')}
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
  );
}

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
  const [formState, dispatch] = useReducer(
    provisionFormReducer,
    undefined,
    createInitialProvisionFormState
  );

  const {
    showAdvanced,
    planMode,
    selectedProductId,
    trialPeriodDays,
    customPriceAmount,
    customBillingCycle,
    customLimits,
    customGates,
  } = formState;

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

  // Reset form when modal closes (adjust state during render)
  const prevOpenRef = useRef(open);
  if (!open && prevOpenRef.current) {
    reset();
    dispatch({ type: 'RESET' });
  }
  prevOpenRef.current = open;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCmdKShortcut(event)) return;
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) return;
      if (!contentRef.current?.contains(targetNode)) return;

      event.preventDefault();
      const { limits, gates } = applyAdminCustomPlanQuickstart();
      dispatch({ type: 'QUICKSTART', limits, gates });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

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
              <ProvisionBasicFields control={control} errors={errors} isPending={isPending} />

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

                  <PlanModeSelector
                    planMode={planMode}
                    onPlanModeChange={(v) => dispatch({ type: 'SET_PLAN_MODE', value: v })}
                    isPending={isPending}
                  />

                  {(planMode === 'existing' || planMode === 'custom') && (
                    <TrialPeriodSelector
                      trialPeriodDays={trialPeriodDays}
                      onTrialPeriodChange={(v) => dispatch({ type: 'SET_TRIAL_PERIOD', value: v })}
                      isPending={isPending}
                    />
                  )}

                  {planMode === 'existing' && (
                    <ExistingPlanSelector
                      selectedProductId={selectedProductId}
                      onProductChange={(v) => dispatch({ type: 'SET_SELECTED_PRODUCT', value: v })}
                      plans={plans}
                      selectedPlan={selectedPlan}
                      isPending={isPending}
                    />
                  )}

                  {planMode === 'custom' && (
                    <CustomPlanForm
                      customPriceAmount={customPriceAmount}
                      customBillingCycle={customBillingCycle}
                      customLimits={customLimits}
                      customGates={customGates}
                      dispatch={dispatch}
                      isPending={isPending}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="mt-8">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_SHOW_ADVANCED', value: !showAdvanced })}
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
  const [successState, setSuccessState] = useState<{
    copiedField: string | null;
    showAdvanced: boolean;
  }>({ copiedField: null, showAdvanced: false });

  // Reset state when modal closes (adjust state during render)
  const prevSuccessOpenRef = useRef(open);
  if (!open && prevSuccessOpenRef.current) {
    setSuccessState({ copiedField: null, showAdvanced: false });
  }
  prevSuccessOpenRef.current = open;

  const { copiedField, showAdvanced } = successState;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessState((prev) => ({ ...prev, copiedField: field }));
      setTimeout(() => setSuccessState((prev) => ({ ...prev, copiedField: null })), 2000);
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
          <ProvisionSuccessContent
            result={result}
            copiedField={copiedField}
            showAdvanced={showAdvanced}
            onCopy={handleCopy}
          />

          {/* Footer */}
          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() =>
                setSuccessState((prev) => ({
                  ...prev,
                  showAdvanced: !prev.showAdvanced,
                }))
              }
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
