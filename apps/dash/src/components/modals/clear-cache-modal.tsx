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
import type { CacheType } from '@workspace/contract';
import { useState } from 'react';

interface ClearCacheModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (types: CacheType[]) => void;
  isLoading?: boolean;
}

const CACHE_TYPES: Array<{ value: CacheType; label: string; description: string }> = [
  {
    value: 'billing',
    label: 'Billing Cache',
    description: 'Clear billing access and subscription status cache',
  },
  {
    value: 'subscription',
    label: 'Subscription Cache',
    description: 'Clear dispute and refund status cache',
  },
  {
    value: 'entitlement',
    label: 'Entitlement Cache',
    description: 'Clear usage summary and recording limits cache',
  },
  {
    value: 'link',
    label: 'Link Cache',
    description: 'Clear link preferences and settings cache',
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
