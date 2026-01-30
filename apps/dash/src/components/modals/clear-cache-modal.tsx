'use client';

import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { useState } from 'react';

import type { CacheType } from '@/types';

interface ClearCacheModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (types: CacheType[]) => void;
  isLoading?: boolean;
}

const CACHE_TYPES: Array<{ value: CacheType; label: string; description: string }> = [
  {
    value: 'all',
    label: 'All Caches',
    description: 'Clear all cache types for this workspace',
  },
  {
    value: 'billing',
    label: 'Billing',
    description: 'Subscription access and status',
  },
  {
    value: 'safety_latches',
    label: 'Safety Latches',
    description: 'Dispute and refund flags',
  },
  {
    value: 'entitlement',
    label: 'Entitlement',
    description: 'Usage summary and resource limits',
  },
  {
    value: 'workspace_recording',
    label: 'Workspace Recording',
    description: 'Branding and recording limit settings',
  },
  {
    value: 'domain_recording',
    label: 'Domain Recording',
    description: 'Domain capture settings (logs, sensitivity)',
  },
  {
    value: 'link',
    label: 'Link Data',
    description: 'Link core data and session mappings',
  },
  {
    value: 'integration',
    label: 'Integrations',
    description: 'Integration lookup caches',
  },
];

export function ClearCacheModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ClearCacheModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<CacheType[]>([]);

  const handleToggle = (type: CacheType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleConfirm = () => {
    if (selectedTypes.length > 0) {
      onConfirm(selectedTypes);
    }
  };

  const handleClose = () => {
    setSelectedTypes([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Clear Server Cache</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select the cache types you want to clear
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-3">
            {CACHE_TYPES.map((cacheType) => (
              <div key={cacheType.value} className="flex items-start gap-2">
                <Checkbox
                  id={cacheType.value}
                  checked={selectedTypes.includes(cacheType.value)}
                  onCheckedChange={() => handleToggle(cacheType.value)}
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={cacheType.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {cacheType.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{cacheType.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleConfirm}
              disabled={isLoading || selectedTypes.length === 0}
            >
              {isLoading ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
