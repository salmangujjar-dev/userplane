'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  DEFAULT_RETENTION_DAYS,
  RETENTION_DAYS_VALUES,
  type RetentionDays,
} from '@workspace/contract';
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
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { SUPPORT_LINKS } from '@/constants';
import { ProjectTitleSchema } from '@/schemas';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: {
    title: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  }) => void;
  loading?: boolean;
}

const createProjectFormSchema = z.object({
  title: ProjectTitleSchema,
  isDefault: z.boolean(),
  recordingRetentionDays: z.coerce.number().int() as z.ZodType<RetentionDays>,
});

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreateProject,
  loading = false,
}: CreateProjectModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(createProjectFormSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      isDefault: false,
      recordingRetentionDays: DEFAULT_RETENTION_DAYS,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setShowAdvanced(false);
    }
  }, [open, reset]);

  const onSubmit = (data: {
    title: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  }) => {
    onCreateProject(data);
  };

  const handleCancel = () => {
    reset();
    setShowAdvanced(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Create New Project</DialogTitle>
                <div className="flex items-center gap-2">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Add a new project to organize your workspace recordings
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
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="project-title"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g., Production App"
                      disabled={loading}
                    />
                  )}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
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
                    <Controller
                      name="isDefault"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="is-default"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="retention-days" className="text-sm font-medium">
                        Recording retention
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Auto-delete recordings after this period
                      </p>
                    </div>
                    <Controller
                      name="recordingRetentionDays"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={loading}
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
                      )}
                    />
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
              <Button type="submit" className="rounded-full px-6" disabled={!isValid || loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
