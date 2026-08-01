'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  LINK_PROVIDER_TYPE_OPTIONS,
  type LinkProviderType,
  LinkProviderTypeSchema,
} from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { Switch } from '@userplane/ui/components/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { LinkReferenceInput } from '@/components/link-reference-input';
import { metaEntriesToRecord, MetaInput, recordToMetaEntries } from '@/components/meta-input';
import { SUPPORT_LINKS } from '@/constants';

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  reference?: string;
  isReusable: boolean;
  linkProvider?: LinkProviderType;
  linkProviderId?: string;
  linkMeta?: Record<string, string> | null;
  onSave: (
    title: string,
    reference: string,
    isReusable: boolean,
    linkProvider?: LinkProviderType,
    linkProviderId?: string,
    meta?: Record<string, string>
  ) => void;
}

const editLinkFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  // Allow empty string (no reference) or a valid URL; undefined also accepted
  reference: z.string().optional(),
  linkProvider: LinkProviderTypeSchema.optional(),
  providerId: z.string().optional(),
  isReusable: z.boolean(),
  meta: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
});

export function EditLinkModal({
  open,
  onOpenChange,
  title,
  reference = '',
  isReusable,
  linkProvider,
  linkProviderId,
  linkMeta,
  onSave,
}: EditLinkModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [view, setView] = useState<'form' | 'meta'>('form');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(editLinkFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: title,
      reference: reference,
      linkProvider: linkProvider,
      providerId: linkProviderId || '',
      isReusable: isReusable,
      meta: recordToMetaEntries(linkMeta),
    },
  });

  // useWatch rather than watch(): watch() returns a fresh function each render,
  // which the React Compiler cannot memoize.
  const selectedProvider = useWatch({ control, name: 'linkProvider' });
  const metaCount = (useWatch({ control, name: 'meta' }) ?? []).filter(
    (e: { key: string; value: string }) => e.key.trim() !== ''
  ).length;

  // Reset form when the modal opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      reset({
        title: title,
        reference: reference,
        linkProvider: linkProvider,
        providerId: linkProviderId || '',
        isReusable: isReusable,
        meta: recordToMetaEntries(linkMeta),
      });
      setShowAdvanced(false);
      setView('form');
    }
  }

  const onSubmit = (data: z.infer<typeof editLinkFormSchema>) => {
    onSave(
      data.title,
      data.reference || '',
      data.isReusable,
      data.linkProvider,
      data.providerId,
      metaEntriesToRecord(data.meta) ?? {}
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        {view === 'meta' ? (
          <>
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <Logo variant="tiled" size="md" showText={false} />
                <div className="flex flex-col space-y-1">
                  <DialogTitle className="text-xl font-semibold">Link Metadata</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Custom key-value pairs for this link
                  </DialogDescription>
                </div>
              </div>
              <Controller
                name="meta"
                control={control}
                render={({ field }) => (
                  <MetaInput value={field.value ?? []} onChange={field.onChange} />
                )}
              />
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => setView('form')}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <Button
                type="button"
                variant="secondary"
                className="px-6"
                onClick={() => setView('form')}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <Logo variant="tiled" size="md" showText={false} />
                <div className="flex flex-col space-y-1">
                  <DialogTitle className="text-xl font-semibold">Edit Recording Link</DialogTitle>
                  <div className="flex items-center gap-2">
                    <DialogDescription className="text-sm text-muted-foreground">
                      View and update the recording link
                    </DialogDescription>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={SUPPORT_LINKS.recordingLinks}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Learn more about recording links</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="link-title" className="text-sm font-medium">
                      Link Title
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Give this recording link a descriptive name
                    </p>
                  </div>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="link-title"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Enter link title"
                      />
                    )}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="link-reference" className="text-sm font-medium">
                      Link Reference
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Add a link, ticket, issue number or customer reference
                    </p>
                  </div>
                  <Controller
                    name="reference"
                    control={control}
                    render={({ field }) => (
                      <LinkReferenceInput
                        id="link-reference"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="e.g. https://github.com/org/repo/issues/123, JIRA-456, Customer ABC"
                      />
                    )}
                  />
                </div>

                {showAdvanced && (
                  <div className="space-y-5 pt-5 border-t">
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <Label htmlFor="link-provider" className="text-sm font-medium">
                          Link Provider
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Select the integration provider for this link
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <span
                              className={
                                selectedProvider ? 'text-foreground' : 'text-muted-foreground'
                              }
                            >
                              {selectedProvider
                                ? LINK_PROVIDER_TYPE_OPTIONS.find(
                                    (p) => p.value === selectedProvider
                                  )?.label
                                : 'Select a provider'}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                          {LINK_PROVIDER_TYPE_OPTIONS.map((provider) => (
                            <DropdownMenuItem
                              key={provider.value}
                              onClick={() => setValue('linkProvider', provider.value)}
                              className="cursor-pointer"
                            >
                              {provider.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <Label htmlFor="provider-id" className="text-sm font-medium">
                          Link Provider ID
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Enter the ticket, issue, or reference ID from your provider
                        </p>
                      </div>
                      <Controller
                        name="providerId"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="provider-id"
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="e.g., JIRA-123, #456, ticket-789"
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="reusable" className="text-sm font-medium">
                          Reusable Link
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Allow multiple recordings with this link
                        </p>
                      </div>
                      <Controller
                        name="isReusable"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="reusable"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Link Metadata</Label>
                        <p className="text-xs text-muted-foreground">
                          Custom key-value pairs attached to this link
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setView('meta')}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {metaCount > 0
                          ? `${metaCount} ${metaCount === 1 ? 'field' : 'fields'}`
                          : 'Add'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Advanced Options
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Advanced Options
                  </>
                )}
              </button>
              <div
                className={`flex gap-2 transition-opacity ${isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button type="submit" className="px-6" disabled={!isValid}>
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
