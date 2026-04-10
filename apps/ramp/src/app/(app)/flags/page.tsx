'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  applyOverrides,
  type FeatureFlag,
  type RuntimeFlagInfo,
  type RuntimeVariantInfo,
  type VariantFlag,
} from '@/lib/feature-flags';
import { cn } from '@/lib/utils';

type GroupedFlags = Record<string, RuntimeFlagInfo[]>;
type GroupedVariants = Record<string, RuntimeVariantInfo[]>;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Client UI': 'Client-side rendering and interaction failures',
  Auth: 'Authentication and account flow failures',
  'Server API': 'Server endpoint errors and status codes',
  'Chaos (API)': 'Cross-cutting API chaos: latency, errors, bad data',
  'Chaos (Client)': 'Client-side network and console chaos',
  Integrations: 'Third-party integration configuration',
};

function groupByCategory(flags: RuntimeFlagInfo[]): GroupedFlags {
  const groups: GroupedFlags = {};
  for (const flag of flags) {
    const group = groups[flag.category] ?? (groups[flag.category] = []);
    group.push(flag);
  }
  return groups;
}

function groupVariantsByCategory(variants: RuntimeVariantInfo[]): GroupedVariants {
  const groups: GroupedVariants = {};
  for (const v of variants) {
    const group = groups[v.category] ?? (groups[v.category] = []);
    group.push(v);
  }
  return groups;
}

interface ResponseData {
  flags: RuntimeFlagInfo[];
  variants: RuntimeVariantInfo[];
}

export default function FlagsPage() {
  const [serverFlags, setServerFlags] = useState<RuntimeFlagInfo[]>([]);
  const [localFlags, setLocalFlags] = useState<RuntimeFlagInfo[]>([]);
  const [serverVariants, setServerVariants] = useState<RuntimeVariantInfo[]>([]);
  const [localVariants, setLocalVariants] = useState<RuntimeVariantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const syncFromResponse = useCallback((data: ResponseData) => {
    setServerFlags(data.flags);
    setLocalFlags(data.flags);
    setServerVariants(data.variants);
    setLocalVariants(data.variants);

    const overrides: Partial<Record<FeatureFlag, boolean>> = {};
    for (const f of data.flags) {
      if (f.isOverridden) overrides[f.flag] = f.value;
    }
    const variantOverrides: Partial<Record<VariantFlag, string>> = {};
    for (const v of data.variants) {
      if (v.isOverridden) variantOverrides[v.flag] = v.value;
    }
    applyOverrides(overrides, variantOverrides);
  }, []);

  const fetchFlags = useCallback(async () => {
    const res = await fetch('/api/flags');
    const json = await res.json();
    syncFromResponse(json.data);
    setLoading(false);
  }, [syncFromResponse]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const { isDirty, pendingChangeCount } = useMemo(() => {
    const serverMap = new Map(serverFlags.map((f) => [f.flag, f.value]));
    const serverVariantMap = new Map(serverVariants.map((v) => [v.flag, v.value]));
    let count = 0;
    for (const f of localFlags) {
      if (f.value !== serverMap.get(f.flag)) count++;
    }
    for (const v of localVariants) {
      if (v.value !== serverVariantMap.get(v.flag)) count++;
    }
    return { isDirty: count > 0, pendingChangeCount: count };
  }, [localFlags, serverFlags, localVariants, serverVariants]);

  const handleToggle = (flag: FeatureFlag, newValue: boolean) => {
    setLocalFlags((prev) => prev.map((f) => (f.flag === flag ? { ...f, value: newValue } : f)));
  };

  const handleVariantChange = (flag: VariantFlag, newValue: string) => {
    setLocalVariants((prev) => prev.map((v) => (v.flag === flag ? { ...v, value: newValue } : v)));
  };

  const handleSave = async () => {
    setSaving(true);
    const overrides: Record<string, boolean> = {};
    for (const f of localFlags) {
      overrides[f.flag] = f.value;
    }
    const variantOverrides: Record<string, string> = {};
    for (const v of localVariants) {
      variantOverrides[v.flag] = v.value;
    }

    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-overrides', overrides, variantOverrides }),
      });
      const json = await res.json();
      syncFromResponse(json.data);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalFlags(serverFlags);
    setLocalVariants(serverVariants);
  };

  const handleResetAll = () => {
    setLocalFlags((prev) => prev.map((f) => ({ ...f, value: f.defaultValue })));
    setLocalVariants((prev) => prev.map((v) => ({ ...v, value: v.defaultValue })));
  };

  const {
    serverValueMap,
    serverVariantValueMap,
    serverOverrideMap,
    serverOverrideCount,
    activeFailureCount,
  } = useMemo(() => {
    const valueMap = new Map(serverFlags.map((f) => [f.flag, f.value]));
    const variantValueMap = new Map(serverVariants.map((v) => [v.flag, v.value]));
    const overrideMap = new Map(serverFlags.map((f) => [f.flag, f.isOverridden]));

    let overrides = 0;
    for (const f of serverFlags) if (f.isOverridden) overrides++;
    for (const v of serverVariants) if (v.isOverridden) overrides++;

    const active = localFlags.filter((f) => f.value === true).length;

    return {
      serverValueMap: valueMap,
      serverVariantValueMap: variantValueMap,
      serverOverrideMap: overrideMap,
      serverOverrideCount: overrides,
      activeFailureCount: active,
    };
  }, [serverFlags, serverVariants, localFlags]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Loading flags...</p>
      </div>
    );
  }

  const totalFlagCount = localFlags.length + localVariants.length;

  const grouped = groupByCategory(localFlags);
  const groupedVariants = groupVariantsByCategory(localVariants);
  const categoryOrder = [
    'Client UI',
    'Auth',
    'Server API',
    'Chaos (API)',
    'Chaos (Client)',
    'Integrations',
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Failure Injection</h2>
          <p className="text-sm text-muted-foreground">
            Toggle on to activate a failure. Toggle off for normal behavior.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-muted-foreground">{totalFlagCount} flags</span>
            {activeFailureCount > 0 && (
              <Badge variant="error" size="sm">
                {activeFailureCount} active
              </Badge>
            )}
            {serverOverrideCount > 0 && (
              <Badge variant="warning" size="sm">
                {serverOverrideCount} overridden
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetAll}>
          Reset all to defaults
        </Button>
      </div>

      {/* Flag groups */}
      {categoryOrder.map((category) => {
        const categoryFlags = grouped[category];
        const categoryVariants = groupedVariants[category];
        if (!categoryFlags?.length && !categoryVariants?.length) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold mb-1">{category}</h3>
            {CATEGORY_DESCRIPTIONS[category] && (
              <p className="text-xs text-muted-foreground mb-3">
                {CATEGORY_DESCRIPTIONS[category]}
              </p>
            )}
            <div className="rounded-lg border divide-y">
              {categoryFlags?.map((flag) => {
                const isUnsaved = flag.value !== serverValueMap.get(flag.flag);
                const isServerOverridden = serverOverrideMap.get(flag.flag);
                return (
                  <div
                    key={flag.flag}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{flag.flag}</code>
                        {isUnsaved && (
                          <Badge variant="info" size="sm">
                            unsaved
                          </Badge>
                        )}
                        {isServerOverridden && (
                          <Badge variant="warning" size="sm">
                            overridden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          flag.value ? 'text-destructive-foreground' : 'text-success-foreground'
                        )}
                      >
                        {flag.value ? 'Failing' : 'OK'}
                      </span>
                      <Switch
                        variant={flag.value ? 'destructive' : 'default'}
                        checked={flag.value}
                        onCheckedChange={(checked) => handleToggle(flag.flag, checked)}
                      />
                    </div>
                  </div>
                );
              })}
              {categoryVariants?.map((variant) => {
                const isUnsaved = variant.value !== serverVariantValueMap.get(variant.flag);
                const isServerOverridden = serverVariants.some(
                  (sv) => sv.flag === variant.flag && sv.isOverridden
                );

                return (
                  <div
                    key={variant.flag}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{variant.flag}</code>
                        {isUnsaved && (
                          <Badge variant="info" size="sm">
                            unsaved
                          </Badge>
                        )}
                        {isServerOverridden && (
                          <Badge variant="warning" size="sm">
                            overridden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{variant.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Select
                        value={variant.value}
                        onValueChange={(val) => {
                          if (val !== null) handleVariantChange(variant.flag, val);
                        }}
                      >
                        <SelectTrigger size="sm" className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {variant.allowedValues.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="mt-6" />
          </div>
        );
      })}

      {/* Sticky bottom action bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-sm text-muted-foreground">
              {pendingChangeCount} unsaved change{pendingChangeCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
