import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { LINK_PROVIDER_TYPE_OPTIONS, type LinkProviderType } from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import { Switch } from '@userplane/ui/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { ArrowLeft, ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DinoError } from '@/components/shared/dino-error';
import { LinkReferenceInput } from '@/components/shared/link-reference-input';
import { SUPPORT_LINKS } from '@/constants';
import { useUpdateLink } from '@/features/links';
import { useWorkspaceId } from '@/stores/workspace';

const editLinkFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  reference: z.string().optional(),
  linkProvider: z.string().optional(),
  providerId: z.string().optional(),
  isReusable: z.boolean(),
});

type EditLinkFormValues = z.infer<typeof editLinkFormSchema>;

interface EditLinkViewProps {
  linkId: string;
  title: string;
  reference: string;
  isReusable: boolean;
  linkProvider?: string;
  linkProviderId?: string;
}

export function EditLinkView({
  linkId,
  title,
  reference,
  isReusable,
  linkProvider,
  linkProviderId,
}: EditLinkViewProps) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const updateLink = useUpdateLink(workspaceId);
  const [error, setError] = useState<{ message: string } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<EditLinkFormValues>({
    resolver: zodResolver(editLinkFormSchema),
    mode: 'onChange',
    defaultValues: {
      title,
      reference,
      linkProvider,
      providerId: linkProviderId || '',
      isReusable,
    },
  });

  const selectedProvider = watch('linkProvider');

  const onSubmit = (data: EditLinkFormValues) => {
    setError(null);
    updateLink.mutate(
      {
        linkId,
        title: data.title,
        reference: data.reference || '',
        reusable: data.isReusable,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            navigate({ to: '/' });
            return;
          }
          setError({ message: result.error.message || 'Failed to update link' });
        },
        onError: (err: unknown) => {
          const errorObj = err as { message?: string };
          setError({ message: errorObj.message || 'Failed to update link' });
        },
      }
    );
  };

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <DinoError
          title="Unable to Update Link"
          description={error.message}
          primaryAction={{ label: 'Try Again', onClick: () => setError(null) }}
          secondaryAction={{ label: 'Go Back', onClick: () => navigate({ to: '/' }) }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate({ to: '/' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Edit Link</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">Update your recording link</p>
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
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
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
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
                        className={selectedProvider ? 'text-foreground' : 'text-muted-foreground'}
                      >
                        {selectedProvider
                          ? LINK_PROVIDER_TYPE_OPTIONS.find((p) => p.value === selectedProvider)
                              ?.label
                          : 'Select a provider'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                    {LINK_PROVIDER_TYPE_OPTIONS.map((provider) => (
                      <DropdownMenuItem
                        key={provider.value}
                        onClick={() => setValue('linkProvider', provider.value as LinkProviderType)}
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
                    <Switch id="reusable" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <a
              href={SUPPORT_LINKS.recordingLinks}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </a>
            <div
              className={`flex gap-2 transition-opacity ${isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                className="px-6"
              >
                Cancel
              </Button>
              <Button type="submit" className="px-6" disabled={!isValid || updateLink.isPending}>
                {updateLink.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
