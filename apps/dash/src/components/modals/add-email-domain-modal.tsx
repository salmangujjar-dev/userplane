'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { DomainInput } from '@/components/domain-input';
import { emailDomainSchema } from '@/lib/validations';

interface AddEmailDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (domain: string) => void;
  existingDomains: string[];
}

export function AddEmailDomainModal({
  open,
  onOpenChange,
  onAdd,
  existingDomains,
}: AddEmailDomainModalProps) {
  const addEmailDomainFormSchema = z.object({
    domain: emailDomainSchema.refine((domain) => !existingDomains.includes(domain.toLowerCase()), {
      message: 'This domain has already been added',
    }),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(addEmailDomainFormSchema),
    mode: 'onTouched',
    defaultValues: {
      domain: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleAdd = (data: { domain: string }) => {
    onAdd(data.domain.toLowerCase().trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={handleSubmit(handleAdd)}>
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Add Email Domain</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Add a domain to allow users with matching email addresses
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-domain">Email Domain</Label>
                <Controller
                  name="domain"
                  control={control}
                  render={({ field }) => (
                    <DomainInput
                      id="email-domain"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="example.com"
                      error={!!errors.domain}
                    />
                  )}
                />
                {errors.domain && (
                  <p className="text-sm text-destructive">{errors.domain.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full px-6" disabled={!isValid}>
              Add Domain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
