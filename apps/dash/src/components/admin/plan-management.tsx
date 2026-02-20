'use client';

import { AdminPlanBillingCycleSchema, type AdminPlanProduct } from '@workspace/contract';
import type { FeatureGate, ResourceType } from '@workspace/pricing';
import { FEATURE_GATE_KEYS, FEATURE_GATE_LABELS, RESOURCE_TYPE_VALUES } from '@workspace/pricing';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import { VisuallyHidden } from '@workspace/ui/components/visually-hidden';
import { ChevronLeft, ChevronRight, CreditCard, Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { AdminPlanMetadataLine, AdminPlanSummaryRow } from '@/components/admin/plan-display';
import {
  applyAdminCustomPlanQuickstart,
  isCmdKShortcut,
  useAdminCreatePlan,
  useAdminPlans,
  useAdminUpdatePlan,
} from '@/features/admin';

// ============================================
// SHARED PRIMITIVES
// ============================================

type BillingCycle = z.infer<typeof AdminPlanBillingCycleSchema>;
type LimitField = 'quotedLimit' | 'actualLimit';
type LimitRecord = Record<ResourceType, { quotedLimit: number; actualLimit: number }>;
type GateRecord = Record<FeatureGate, boolean>;

function inferBillingCycle(price: AdminPlanProduct['price']): BillingCycle {
  if (!price || price.type !== 'recurring_price') {
    return 'monthly';
  }

  if (
    (price.paymentFrequencyInterval === 'Year' && (price.paymentFrequencyCount ?? 1) === 1) ||
    (price.paymentFrequencyInterval === 'Month' && (price.paymentFrequencyCount ?? 1) === 12)
  ) {
    return 'annual';
  }

  return 'monthly';
}

function FeatureLimitsTable({
  limits,
  onUpdate,
}: {
  limits: LimitRecord;
  onUpdate: (rt: ResourceType, field: LimitField, value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Feature Limits</h3>
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
              value={limits[rt]?.quotedLimit ?? 0}
              onChange={(e) => onUpdate(rt, 'quotedLimit', e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              value={limits[rt]?.actualLimit ?? 0}
              onChange={(e) => onUpdate(rt, 'actualLimit', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Use -1 for unlimited</p>
    </section>
  );
}

function FeatureGatesPanel({
  gates,
  onChange,
}: {
  gates: GateRecord;
  onChange: (gate: FeatureGate, checked: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Feature Gates</h3>
      <div className="rounded-lg border divide-y">
        {FEATURE_GATE_KEYS.map((gate) => (
          <div key={gate} className="flex items-center justify-between p-3">
            <span className="text-sm">{FEATURE_GATE_LABELS[gate]}</span>
            <Switch
              checked={gates[gate] ?? false}
              onCheckedChange={(checked) => onChange(gate, checked)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// PLAN CARD
// ============================================

function PlanCard({ product, onClick }: { product: AdminPlanProduct; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border p-4 text-left hover:bg-accent/50 transition-colors w-full"
    >
      <div className="space-y-1.5">
        <AdminPlanSummaryRow
          plan={product}
          rightSlot={
            product.isRecurring ? (
              <Badge variant="secondary" className="text-xs shrink-0">
                Recurring
              </Badge>
            ) : null
          }
        />
        <AdminPlanMetadataLine plan={product} />
        <div className="sr-only">{product.isRecurring ? 'Recurring plan' : 'One-time plan'}</div>
      </div>
    </button>
  );
}

// ============================================
// PLAN DETAIL SHEET
// ============================================

function PlanDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: AdminPlanProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useAdminUpdatePlan();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [limits, setLimits] = useState<LimitRecord>({} as LimitRecord);
  const [gates, setGates] = useState<GateRecord>({} as GateRecord);

  useEffect(() => {
    if (!product) return;

    setName(product.name ?? '');
    setDescription(product.description ?? '');
    setPriceAmount(product.price ? String(product.price.price / 100) : '0');
    setBillingCycle(inferBillingCycle(product.price));

    const newLimits = {} as LimitRecord;
    for (const rt of RESOURCE_TYPE_VALUES) {
      const existing = product.featureLimits?.find((l) => l.resourceType === rt);
      newLimits[rt] = {
        quotedLimit: existing?.quotedLimit ?? 0,
        actualLimit: existing?.actualLimit ?? 0,
      };
    }
    setLimits(newLimits);

    const newGates = {} as GateRecord;
    for (const key of FEATURE_GATE_KEYS) {
      const existing = product.featureGates?.find((g) => g.gate === key);
      newGates[key] = existing?.enabled ?? false;
    }
    setGates(newGates);
  }, [product]);

  const updateLimit = (rt: ResourceType, field: LimitField, value: string) => {
    setLimits((prev) => ({ ...prev, [rt]: { ...prev[rt], [field]: Number(value) || 0 } }));
  };

  const handleSave = useCallback(() => {
    if (!product) return;

    updateMutation.mutate(
      {
        productId: product.productId,
        name,
        description: description || null,
        price: {
          amountCents: Math.round(Number(priceAmount) * 100),
          billingCycle,
          taxInclusive: product.price?.taxInclusive ?? null,
        },
        featureLimits: RESOURCE_TYPE_VALUES.map((rt) => ({ resourceType: rt, ...limits[rt] })),
        featureGates: FEATURE_GATE_KEYS.map((gate) => ({ gate, enabled: gates[gate] ?? false })),
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }, [
    product,
    name,
    description,
    priceAmount,
    billingCycle,
    limits,
    gates,
    updateMutation,
    onOpenChange,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product?.name || 'Product Details'}</SheetTitle>
          <SheetDescription>{product?.productId}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-4">
          {/* Product Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">Product Info</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="plan-name">Name</Label>
                <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="plan-description">Description</Label>
                <Textarea
                  id="plan-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="plan-price">Price</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Billing Cycle</Label>
                  <Select
                    value={billingCycle}
                    onValueChange={(v) => setBillingCycle(v as BillingCycle)}
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
            </div>
          </section>

          <FeatureLimitsTable limits={limits} onUpdate={updateLimit} />
          <FeatureGatesPanel
            gates={gates}
            onChange={(gate, checked) => setGates((prev) => ({ ...prev, [gate]: checked }))}
          />

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// CREATE PLAN SHEET
// ============================================

function CreatePlanSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const createMutation = useAdminCreatePlan();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const initLimits = (): LimitRecord => {
    const init = {} as LimitRecord;
    for (const rt of RESOURCE_TYPE_VALUES) init[rt] = { quotedLimit: 0, actualLimit: 0 };
    return init;
  };

  const initGates = (): GateRecord => {
    const init = {} as GateRecord;
    for (const key of FEATURE_GATE_KEYS) init[key] = false;
    return init;
  };

  const [limits, setLimits] = useState<LimitRecord>(initLimits);
  const [gates, setGates] = useState<GateRecord>(initGates);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setPriceAmount('');
      setBillingCycle('monthly');
      setLimits(initLimits());
      setGates(initGates());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCmdKShortcut(event)) return;
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) return;
      if (!contentRef.current?.contains(targetNode)) return;

      event.preventDefault();
      const { limits: quickstartLimits, gates: quickstartGates } = applyAdminCustomPlanQuickstart();
      setLimits(quickstartLimits);
      setGates(quickstartGates);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const updateLimit = (rt: ResourceType, field: LimitField, value: string) => {
    setLimits((prev) => ({ ...prev, [rt]: { ...prev[rt], [field]: Number(value) || 0 } }));
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate(
      {
        name,
        description: description || undefined,
        price: {
          amountCents: Math.round((Number(priceAmount) || 0) * 100),
          billingCycle,
        },
        featureLimits: RESOURCE_TYPE_VALUES.map((rt) => ({ resourceType: rt, ...limits[rt] })),
        featureGates: FEATURE_GATE_KEYS.map((gate) => ({ gate, enabled: gates[gate] ?? false })),
      },
      { onSuccess: (result) => result.success && onOpenChange(false) }
    );
  }, [name, description, priceAmount, billingCycle, limits, gates, createMutation, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={contentRef} className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Plan Product</SheetTitle>
          <VisuallyHidden>
            <SheetDescription>Create a new DodoPayments product</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>

        <div className="space-y-6 px-4 py-4">
          {/* Product Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">Product Info</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Enterprise Monthly"
                />
              </div>
              <div>
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <Select
                  value={billingCycle}
                  onValueChange={(v) => setBillingCycle(v as BillingCycle)}
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
              <div>
                <Label htmlFor="create-price">Price</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  placeholder="e.g. 99.00"
                />
              </div>
            </div>
          </section>

          <FeatureLimitsTable limits={limits} onUpdate={updateLimit} />
          <FeatureGatesPanel
            gates={gates}
            onChange={(gate, checked) => setGates((prev) => ({ ...prev, [gate]: checked }))}
          />

          <div className="flex justify-end pt-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending || !name}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Plan
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const PAGE_SIZE = 5;

export function PlanManagement() {
  const [pageNumber, setPageNumber] = useState(0);
  const { data: plansResult, isLoading } = useAdminPlans({ pageNumber, pageSize: PAGE_SIZE });
  const [selectedProduct, setSelectedProduct] = useState<AdminPlanProduct | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const products = plansResult?.success ? plansResult.data.products : [];
  const hasNextPage = products.length === PAGE_SIZE;
  const hasPrevPage = pageNumber > 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0 && pageNumber === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No plan products found</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowCreateSheet(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
        <CreatePlanSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <PlanCard
            key={product.productId}
            product={product as AdminPlanProduct}
            onClick={() => setSelectedProduct(product as AdminPlanProduct)}
          />
        ))}
      </div>

      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">Page {pageNumber + 1}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevPage}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <PlanDetailSheet
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />

      <CreatePlanSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
    </>
  );
}

// Export for page-level control of create sheet
PlanManagement.CreateSheet = CreatePlanSheet;
