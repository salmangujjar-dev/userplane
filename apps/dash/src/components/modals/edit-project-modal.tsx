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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SUPPORT_LINKS } from '@/constants';
import { useSubscriptionStatus } from '@/features/billing';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: number;
    title: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  } | null;
  onSave: (
    projectId: number,
    project: { title: string; isDefault: boolean; recordingRetentionDays: RetentionDays }
  ) => void;
  loading?: boolean;
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSave,
  loading = false,
}: EditProjectModalProps) {
  const [editedProject, setEditedProject] = useState({
    title: '',
    isDefault: false,
    recordingRetentionDays: 30 as RetentionDays,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const featureGates = subscriptionData?.featureGates;
  const { triggerUpsell } = useFeatureUpsell();

  useEffect(() => {
    if (open && project) {
      setEditedProject({
        title: project.title,
        isDefault: project.isDefault,
        recordingRetentionDays: project.recordingRetentionDays,
      });
      setShowAdvanced(false);
    }
  }, [open, project]);

  const handleSave = () => {
    const isValid = editedProject.title.trim();

    if (isValid && project) {
      onSave(project.id, editedProject);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isFormValid = editedProject.title.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Edit Project</DialogTitle>
              <div className="flex items-center gap-2">
                <DialogDescription className="text-sm text-muted-foreground">
                  Update project details and settings
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={SUPPORT_LINKS.projects}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn more about projects</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-sm">
                Project Title
              </Label>
              <Input
                id="project-title"
                value={editedProject.title}
                onChange={(e) => setEditedProject((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Production App"
                disabled={loading}
              />
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-default" className="text-sm font-medium">
                      Set as default
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Make this the default project for new recordings
                    </p>
                  </div>
                  <Switch
                    id="is-default"
                    checked={editedProject.isDefault}
                    onCheckedChange={(checked) =>
                      setEditedProject((prev) => ({ ...prev, isDefault: checked }))
                    }
                    disabled={loading}
                  />
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between',
                    !featureGates?.customizeRetentionPolicy && 'cursor-pointer'
                  )}
                  onClick={
                    !featureGates?.customizeRetentionPolicy
                      ? () => triggerUpsell('customizeRetentionPolicy')
                      : undefined
                  }
                >
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={
                        featureGates?.customizeRetentionPolicy ? 'retention-days' : undefined
                      }
                      className={cn(
                        'text-sm font-medium',
                        !featureGates?.customizeRetentionPolicy &&
                          'text-muted-foreground cursor-pointer'
                      )}
                    >
                      Recording retention
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Auto-delete recordings after this period
                    </p>
                  </div>
                  <span
                    className={cn(!featureGates?.customizeRetentionPolicy && 'pointer-events-none')}
                  >
                    <Select
                      value={String(editedProject.recordingRetentionDays)}
                      onValueChange={(value) =>
                        setEditedProject((prev) => ({
                          ...prev,
                          recordingRetentionDays: Number(value) as RetentionDays,
                        }))
                      }
                      disabled={loading || !featureGates?.customizeRetentionPolicy}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_DAYS_VALUES.map((days) => (
                          <SelectItem key={days} value={String(days)}>
                            {days} {days === 1 ? 'day' : 'days'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-8">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show more
              </>
            )}
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleSave}
              disabled={!isFormValid || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
