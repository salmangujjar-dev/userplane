'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { applyOverrides, type FeatureFlag, type RuntimeFlagInfo } from '@/lib/feature-flags';

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
  const [serverFlags, setServerFlags] = useState<RuntimeFlagInfo[]>([]);
  const [localFlags, setLocalFlags] = useState<RuntimeFlagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const syncFromResponse = useCallback((data: RuntimeFlagInfo[]) => {
    setServerFlags(data);
    setLocalFlags(data);

    const overrides: Partial<Record<FeatureFlag, boolean>> = {};
    for (const f of data) {
      if (f.isOverridden) overrides[f.flag] = f.value;
    }
    applyOverrides(overrides);
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
    let count = 0;
    for (const f of localFlags) {
      if (f.value !== serverMap.get(f.flag)) count++;
    }
    return { isDirty: count > 0, pendingChangeCount: count };
  }, [localFlags, serverFlags]);

  const handleToggle = (flag: FeatureFlag, newValue: boolean) => {
    setLocalFlags((prev) => prev.map((f) => (f.flag === flag ? { ...f, value: newValue } : f)));
  };

  const handleSave = async () => {
    setSaving(true);
    const overrides: Record<string, boolean> = {};
    for (const f of localFlags) {
      overrides[f.flag] = f.value;
    }

    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-overrides', overrides }),
      });
      const json = await res.json();
      syncFromResponse(json.data);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalFlags(serverFlags);
  };

  const handleResetAll = () => {
    setLocalFlags((prev) => prev.map((f) => ({ ...f, value: f.defaultValue })));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Loading flags...</p>
      </div>
    );
  }

  const serverOverrideCount = serverFlags.filter((f) => f.isOverridden).length;

  const serverValueMap = new Map(serverFlags.map((f) => [f.flag, f.value]));

  const grouped = groupByCategory(localFlags);
  const categoryOrder = ['Client UI', 'Auth', 'Server API', 'Chaos (API)', 'Chaos (Client)'];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{localFlags.length} flags</span>
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
        if (!categoryFlags?.length) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold mb-3">{category}</h3>
            <div className="rounded-lg border divide-y">
              {categoryFlags.map((flag) => {
                const isUnsaved = flag.value !== serverValueMap.get(flag.flag);
                const isServerOverridden = serverFlags.find(
                  (sf) => sf.flag === flag.flag
                )?.isOverridden;

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
                        {flag.isChaos && (
                          <Badge variant="error" size="sm">
                            chaos
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={flag.value}
                        onCheckedChange={(checked) => handleToggle(flag.flag, checked)}
                      />
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
