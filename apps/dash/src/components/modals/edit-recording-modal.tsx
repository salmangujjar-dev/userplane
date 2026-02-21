'use client';

import { RETENTION_DAYS_VALUES, type RetentionDays } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';
import { addDays, differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { useRef, useState } from 'react';

import { useSubscriptionStatus } from '@/features/billing';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';

/**
 * Find the closest retention value matching the remaining days until expiration.
 * Returns the RETENTION_DAYS_VALUES entry whose distance from remainingDays is smallest,
 * or "never" if expiresAt is null.
 */
function getInitialValue(expiresAt: Date | null): string {
  if (!expiresAt) return 'never';

  const remainingDays = differenceInDays(expiresAt, new Date());
  if (remainingDays <= 0) return String(RETENTION_DAYS_VALUES[0]);

  let closest: RetentionDays = RETENTION_DAYS_VALUES[0];
  let minDiff = Math.abs(remainingDays - closest);
  for (const days of RETENTION_DAYS_VALUES) {
    const diff = Math.abs(remainingDays - days);
    if (diff < minDiff) {
      closest = days;
      minDiff = diff;
    }
  }
  return String(closest);
}

interface EditRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExpiresAt: Date | null;
  onSave: (expiresAt: Date | null) => void;
  isLoading?: boolean;
}

export function EditRecordingModal({
  open,
  onOpenChange,
  currentExpiresAt,
  onSave,
  isLoading,
}: EditRecordingModalProps) {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [hasChanged, setHasChanged] = useState(false);
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const featureGates = subscriptionData?.featureGates;
  const { triggerUpsell } = useFeatureUpsell();

  // Pre-select the closest matching value when modal opens
  const prevOpenRef = useRef(open);
  if (open && !prevOpenRef.current) {
    setSelectedValue(getInitialValue(currentExpiresAt));
    setHasChanged(false);
  }
  prevOpenRef.current = open;

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    setHasChanged(true);
  };

  const handleSave = () => {
    if (!hasChanged) return;

    if (selectedValue === 'never') {
      onSave(null);
    } else {
      onSave(addDays(new Date(), Number(selectedValue)));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Edit Recording</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update the recording expiration
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className={cn(
                'space-y-2',
                !featureGates?.customizeRetentionPolicy && 'cursor-pointer'
              )}
              {...(!featureGates?.customizeRetentionPolicy
                ? {
                    role: 'button' as const,
                    tabIndex: 0,
                    onClick: () => triggerUpsell('customizeRetentionPolicy'),
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        triggerUpsell('customizeRetentionPolicy');
                      }
                    },
                  }
                : {})}
            >
              <div className="space-y-0.5">
                <Label
                  htmlFor={featureGates?.customizeRetentionPolicy ? 'expires-at' : undefined}
                  className={cn(
                    'text-sm font-medium',
                    !featureGates?.customizeRetentionPolicy &&
                      'text-muted-foreground cursor-pointer'
                  )}
                >
                  Expiration
                </Label>
                <p className="text-xs text-muted-foreground">
                  {currentExpiresAt
                    ? `Currently expires ${format(currentExpiresAt, 'MMM dd, yyyy HH:mm')} (${formatDistanceToNow(currentExpiresAt, { addSuffix: true })})`
                    : 'Currently set to no expiration'}
                </p>
              </div>
              <span
                className={cn(!featureGates?.customizeRetentionPolicy && 'pointer-events-none')}
              >
                <Select
                  value={selectedValue}
                  onValueChange={handleValueChange}
                  disabled={isLoading || !featureGates?.customizeRetentionPolicy}
                >
                  <SelectTrigger id="expires-at" className="w-full">
                    <SelectValue placeholder="Select new expiration..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RETENTION_DAYS_VALUES.map((days) => (
                      <SelectItem key={days} value={String(days)}>
                        {days} {days === 1 ? 'day' : 'days'} from now
                      </SelectItem>
                    ))}
                    <SelectItem value="never">No expiration</SelectItem>
                  </SelectContent>
                </Select>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <div
            className={`flex gap-2 transition-opacity ${hasChanged ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleSave}
              disabled={!hasChanged || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
