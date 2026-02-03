'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { URLInput } from '@/components/url-input';
import { DomainUrlSchema } from '@/schemas';

const domainFormSchema = z.object({
  domainUrl: DomainUrlSchema,
});

type DomainFormData = z.infer<typeof domainFormSchema>;

interface WorkspaceDomainsSectionProps {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Pure controlled URL input for workspace domain.
 * Uses react-hook-form for validation only.
 * Domain data is fetched by parent and passed as props.
 */
export function WorkspaceDomainsSection({ value, onChange }: WorkspaceDomainsSectionProps) {
  const {
    control,
    formState: { errors },
    setValue,
  } = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    mode: 'onChange',
    defaultValues: {
      domainUrl: value || '',
    },
  });

  // Sync external value changes to form
  useEffect(() => {
    setValue('domainUrl', value);
  }, [value, setValue]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Workspace Domain</label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Domain where recordings will be captured
        </p>
      </div>

      <div className="space-y-1">
        <Controller
          name="domainUrl"
          control={control}
          render={({ field }) => (
            <URLInput
              value={field.value}
              onChange={(url) => {
                field.onChange(url);
                onChange(url);
              }}
              onBlur={field.onBlur}
              placeholder="example.com"
              error={!!errors.domainUrl}
            />
          )}
        />
        {errors.domainUrl && <p className="text-xs text-destructive">{errors.domainUrl.message}</p>}
      </div>
    </div>
  );
}
