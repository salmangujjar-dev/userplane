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
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DomainInput } from '@/components/domain-input';
import { EmailDomainSchema } from '@/schemas';

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
    domain: EmailDomainSchema.refine((domain) => !existingDomains.includes(domain.toLowerCase()), {
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

  // Reset form when the modal opens (adjust state during render)
  const prevOpenRef = useRef(open);
  if (open && !prevOpenRef.current) {
    reset();
  }
  prevOpenRef.current = open;

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
              className="px-6"
            >
              Cancel
            </Button>
            <Button type="submit" className="px-6" disabled={!isValid}>
              Add Domain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
