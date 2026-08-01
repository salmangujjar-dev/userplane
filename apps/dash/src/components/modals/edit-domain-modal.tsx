'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { URLInput } from '@/components/url-input';
import { SUPPORT_LINKS } from '@/constants';
import { DomainUrlSchema } from '@/schemas';

interface EditDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  onSave: (domainUrl: string) => void;
  loading?: boolean;
}

const editDomainFormSchema = z.object({
  domainUrl: DomainUrlSchema,
});

export function EditDomainModal({
  open,
  onOpenChange,
  domainUrl,
  onSave,
  loading = false,
}: EditDomainModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(editDomainFormSchema),
    mode: 'onTouched',
    defaultValues: {
      domainUrl: domainUrl,
    },
  });

  // Reset form when the modal opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      reset({ domainUrl });
    }
  }

  const onSubmit = (data: { domainUrl: string }) => {
    onSave(data.domainUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Edit Domain</DialogTitle>
                <div className="flex items-center gap-2">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Update the domain URL
                  </DialogDescription>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={SUPPORT_LINKS.domains}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Learn more about domains</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain-url">Domain URL</Label>
                <Controller
                  name="domainUrl"
                  control={control}
                  render={({ field }) => (
                    <URLInput
                      id="domain-url"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="example.com"
                      error={!!errors.domainUrl}
                      disabled={loading}
                    />
                  )}
                />
                {errors.domainUrl && (
                  <p className="text-sm text-destructive">{errors.domainUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="px-6" disabled={!isValid || loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
