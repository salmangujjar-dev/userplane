'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { type FeatureFlag, type RuntimeFlagInfo, applyOverrides } from '@/lib/feature-flags';

type GroupedFlags = Record<string, RuntimeFlagInfo[]>;

function groupByCategory(flags: RuntimeFlagInfo[]): GroupedFlags {
  const groups: GroupedFlags = {};
  for (const flag of flags) {
    const group = groups[flag.category] ?? (groups[flag.category] = []);
    group.push(flag);
  }
  return groups;
}

export default function FlagsPage() {
  const [flags, setFlags] = useState<RuntimeFlagInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    const res = await fetch('/api/flags');
    const json = await res.json();
    setFlags(json.data);
    setLoading(false);

    // Sync client-side runtime state
    const overrides: Partial<Record<FeatureFlag, boolean>> = {};
    for (const f of json.data as RuntimeFlagInfo[]) {
      if (f.isOverridden) overrides[f.flag] = f.value;
    }
    applyOverrides(overrides);
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag: FeatureFlag, newValue: boolean) => {
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) =>
        f.flag === flag ? { ...f, value: newValue, isOverridden: newValue !== f.defaultValue } : f
      )
    );

    const res = await fetch(`/api/flags/${flag}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newValue }),
    });
    const json = await res.json();
    setFlags(json.data);

    // Sync client-side runtime state
    const overrides: Partial<Record<FeatureFlag, boolean>> = {};
    for (const f of json.data as RuntimeFlagInfo[]) {
      if (f.isOverridden) overrides[f.flag] = f.value;
    }
    applyOverrides(overrides);
  };

  const handleReset = async (flag: FeatureFlag) => {
    const res = await fetch(`/api/flags/${flag}`, { method: 'DELETE' });
    const json = await res.json();
    setFlags(json.data);

    const overrides: Partial<Record<FeatureFlag, boolean>> = {};
    for (const f of json.data as RuntimeFlagInfo[]) {
      if (f.isOverridden) overrides[f.flag] = f.value;
    }
    applyOverrides(overrides);
  };

  const handleResetAll = async () => {
    const res = await fetch('/api/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-all' }),
    });
    const json = await res.json();
    setFlags(json.data);
    applyOverrides({});
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Loading flags...</p>
      </div>
    );
  }

  const overrideCount = flags.filter((f) => f.isOverridden).length;
  const grouped = groupByCategory(flags);
  const categoryOrder = ['Client UI', 'Auth', 'Server API', 'Chaos (API)', 'Chaos (Client)'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{flags.length} flags</span>
            {overrideCount > 0 && (
              <Badge variant="warning" size="sm">
                {overrideCount} overridden
              </Badge>
            )}
          </div>
        </div>
        {overrideCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleResetAll}>
            Reset all
          </Button>
        )}
      </div>

      {/* Flag groups */}
      {categoryOrder.map((category) => {
        const categoryFlags = grouped[category];
        if (!categoryFlags?.length) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold mb-3">{category}</h3>
            <div className="rounded-lg border divide-y">
              {categoryFlags.map((flag) => (
                <div key={flag.flag} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{flag.flag}</code>
                      {flag.isOverridden && (
                        <Badge variant="warning" size="sm">
                          overridden
                        </Badge>
                      )}
                      {flag.isChaos && (
                        <Badge variant="error" size="sm">
                          chaos
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {flag.isOverridden && (
                      <button
                        onClick={() => handleReset(flag.flag)}
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      >
                        reset
                      </button>
                    )}
                    <Switch
                      checked={flag.value}
                      onCheckedChange={(checked) => handleToggle(flag.flag, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Separator className="mt-6" />
          </div>
        );
      })}
    </div>
  );
}
