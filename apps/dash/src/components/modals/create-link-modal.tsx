'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { toast } from '@workspace/ui/components/sonner';
import { Switch } from '@workspace/ui/components/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  AlertTriangle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  FolderKanban,
  Globe,
  HelpCircle,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Control, UseFormHandleSubmit, UseFormSetValue } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { LinkReferenceInput } from '@/components/link-reference-input';
import { SUPPORT_LINKS } from '@/constants';
import { useWorkspaceDomains } from '@/features/domains';
import { useCreateLink } from '@/features/links';
import { useWorkspaceProjects } from '@/features/projects';
import { mediaClient } from '@/lib/media';
import { useWorkspaceStore } from '@/stores/workspace';
import type { RecordingLimitStatus } from '@/types';

interface CreateLinkModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideButton?: boolean;
  defaultProjectId?: string;
}

const createLinkFormSchema = z.object({
  reference: z.string().optional(),
  domainId: z.string().min(1, 'Please select a domain'),
  projectId: z.string().optional(),
  isReusable: z.boolean(),
});

type CreateLinkFormValues = z.infer<typeof createLinkFormSchema>;

type ModalState =
  | { view: 'create' }
  | { view: 'error'; error: { message: string; code?: string } }
  | { view: 'share'; linkUrl: string; recordingLimitStatus: RecordingLimitStatus };

export function CreateLinkModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideButton = false,
  defaultProjectId,
}: CreateLinkModalProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [state, setState] = useState<ModalState>({ view: 'create' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<CreateLinkFormValues>({
    resolver: zodResolver(createLinkFormSchema),
    mode: 'onBlur',
    defaultValues: {
      reference: '',
      domainId: '',
      projectId: '',
      isReusable: false,
    },
  });

  const selectedDomain = watch('domainId');
  const selectedProject = watch('projectId');

  const { data: projectsResult, isLoading: isLoadingProjects } = useWorkspaceProjects({
    perPage: 10,
  });

  const { data: domainsResult, isLoading: isLoadingDomains } = useWorkspaceDomains({
    perPage: 10,
  });

  const projects = projectsResult?.success ? projectsResult.data.projects : undefined;
  const domains = domainsResult?.success ? domainsResult.data.domains : undefined;

  const createLinkMutation = useCreateLink(workspaceId);

  // Set default project and domain when data loads
  useEffect(() => {
    if (open && projects && projects.length > 0 && !selectedProject) {
      if (defaultProjectId) {
        const projectExists = projects.some((p) => p.projectId === defaultProjectId);
        if (projectExists) {
          setValue('projectId', defaultProjectId);
          return;
        }
      }
      const defaultProject = projects.find((p) => p.isDefault) || projects[0];
      if (defaultProject) {
        setValue('projectId', defaultProject.projectId);
      }
    }
  }, [open, projects, selectedProject, defaultProjectId, setValue]);

  useEffect(() => {
    if (open && domains && domains.length > 0 && !selectedDomain) {
      const verifiedDomain = domains.find((d) => d.domainStatus === 'verified') || domains[0];
      if (verifiedDomain) {
        setValue('domainId', verifiedDomain.domainId, { shouldValidate: true });
      }
    }
  }, [open, domains, selectedDomain, setValue]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setShowAdvanced(false);
      setState({ view: 'create' });
    }
  }, [open, reset]);

  const onSubmit = (data: CreateLinkFormValues) => {
    createLinkMutation.mutate(
      {
        data: {
          domainId: data.domainId,
          projectId: data.projectId || undefined,
          linkReference: data.reference || undefined,
          linkReusable: data.isReusable,
        },
        throwErrors: ['LINK_LIMIT_EXCEEDED'],
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setState({
              view: 'error',
              error: {
                message: result.error.message || 'Failed to create link',
                code: result.error.code,
              },
            });
            return;
          }
          setState({
            view: 'share',
            linkUrl: result.data.link.linkURL,
            recordingLimitStatus: result.data.recordingLimitStatus,
          });
        },
        onError: (err: unknown) => {
          const errorObj = err as { message: string; code?: string };
          setState({
            view: 'error',
            error: { message: errorObj.message || 'Failed to create link', code: errorObj.code },
          });
        },
      }
    );
  };

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideButton && (
        <DialogTrigger asChild>
          <Button variant="default" size="default" className="rounded-full">
            Create Link
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]" showCloseButton={state.view === 'create'}>
        {state.view === 'create' && (
          <FormView
            control={control}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            setValue={setValue}
            domains={domains}
            projects={projects}
            selectedDomain={selectedDomain}
            selectedProject={selectedProject}
            isLoadingDomains={isLoadingDomains}
            isLoadingProjects={isLoadingProjects}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            onClose={handleClose}
            isPending={createLinkMutation.isPending}
            isValid={isValid}
          />
        )}
        {state.view === 'error' && <ErrorView error={state.error} onClose={handleClose} />}
        {state.view === 'share' && (
          <ShareView linkUrl={state.linkUrl} recordingLimitStatus={state.recordingLimitStatus} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Form View
// ============================================================================

function FormView({
  control,
  handleSubmit,
  onSubmit,
  setValue,
  domains,
  projects,
  selectedDomain,
  selectedProject,
  isLoadingDomains,
  isLoadingProjects,
  showAdvanced,
  setShowAdvanced,
  onClose,
  isPending,
  isValid,
}: {
  control: Control<CreateLinkFormValues>;
  handleSubmit: UseFormHandleSubmit<CreateLinkFormValues>;
  onSubmit: (data: CreateLinkFormValues) => void;
  setValue: UseFormSetValue<CreateLinkFormValues>;
  domains?: Array<{ domainId: string; domainUrl: string; domainStatus: string }>;
  projects?: Array<{ projectId: string; projectTitle: string | null; isDefault: boolean }>;
  selectedDomain: string | undefined;
  selectedProject: string | undefined;
  isLoadingDomains: boolean;
  isLoadingProjects: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  onClose: () => void;
  isPending: boolean;
  isValid: boolean;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Create a link</DialogTitle>
            <div className="flex items-center gap-2">
              <DialogDescription className="text-sm text-muted-foreground">
                Create a recording link for customer
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

        <div className="space-y-2.5">
          <div className="space-y-0.5">
            <Label htmlFor="reference" className="text-sm font-medium">
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
                id="reference"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="e.g. https://github.com/org/repo/issues/123, JIRA-456, Customer ABC"
              />
            )}
          />
        </div>

        {domains && domains.length > 0 && (
          <div className="space-y-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="domain" className="text-sm font-medium">
                Domain
              </Label>
              <p className="text-xs text-muted-foreground">
                Select the domain for your recording link
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoadingDomains}
                >
                  <span className="text-foreground">
                    {selectedDomain
                      ? domains.find((d) => d.domainId === selectedDomain)?.domainUrl ||
                        'Select a domain'
                      : 'Select a domain'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                {domains.map((domain) => (
                  <DropdownMenuItem
                    key={domain.domainId}
                    onClick={() => setValue('domainId', domain.domainId)}
                    className="cursor-pointer"
                  >
                    <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    {domain.domainUrl}
                    {domain.domainStatus === 'verified' && (
                      <span className="ml-2 text-xs text-green-600">Verified</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {showAdvanced && (
          <div className="space-y-5 pt-5 border-t">
            {projects && projects.length > 0 && (
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="project" className="text-sm font-medium">
                    Project
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Associate this link with a specific project
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isLoadingProjects}
                    >
                      <span
                        className={selectedProject ? 'text-foreground' : 'text-muted-foreground'}
                      >
                        {selectedProject
                          ? projects.find((p) => p.projectId === selectedProject)?.projectTitle ||
                            'Untitled Project'
                          : 'Select a project'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.projectId}
                        onClick={() => setValue('projectId', project.projectId)}
                        className="cursor-pointer"
                      >
                        <FolderKanban className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        {project.projectTitle || 'Untitled Project'}
                        {project.isDefault && (
                          <span className="ml-2 text-xs text-primary">Default</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reusable" className="text-sm font-medium">
                  Reusable
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow this link to be used multiple times
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
        )}
      </div>

      <DialogFooter className="mt-8">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          disabled={isPending}
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
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full px-6"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full px-6" disabled={isPending || !isValid}>
            {isPending ? 'Creating...' : 'Create Link'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

// ============================================================================
// Error View
// ============================================================================

function ErrorView({
  error,
  onClose,
}: {
  error: { message: string; code?: string };
  onClose: () => void;
}) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  const handleUpgrade = () => {
    if (workspaceId) {
      window.location.href = `/workspace/${workspaceId}/settings?tab=plan-usage`;
    }
  };

  return (
    <>
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Unable to Create Link</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {error.message || (error.code && `Error: ${error.code}`) || 'An error occurred'}
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center py-4">
            <Image
              src={mediaClient.getIconMediaUrl('icons/dino.svg')}
              alt="Error"
              width={120}
              height={120}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-8">
        <a
          href={SUPPORT_LINKS.linkCreationErrors}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
        >
          <HelpCircle className="h-4 w-4" />
          Link issues
        </a>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full px-6" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" className="rounded-full px-6" onClick={handleUpgrade}>
            Upgrade
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

// ============================================================================
// Share View
// ============================================================================

function ShareView({
  linkUrl,
  recordingLimitStatus,
}: {
  linkUrl: string;
  recordingLimitStatus: RecordingLimitStatus;
}) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  // Auto-copy on mount (silent — "Link created" toast is already showing)
  useEffect(() => {
    navigator.clipboard.writeText(linkUrl).catch(() => {});
  }, [linkUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      toast.success('Link copied to clipboard', { id: 'clipboard-copy' });
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleUpgrade = () => {
    if (workspaceId) {
      window.location.href = `/workspace/${workspaceId}/recordings?plan-modal=detailed`;
    }
  };

  const showWarning = recordingLimitStatus !== 'safe';

  const getWarningMessage = (status: RecordingLimitStatus): string => {
    switch (status) {
      case 'hard-exceeded':
        return 'You have exceeded your fair use limit';
      case 'hard-warning':
        return 'You are approaching your fair use limit';
      case 'soft-exceeded':
        return 'You have exceeded your recomended recording limit';
      case 'soft-warning':
        return 'You are approaching your recomended recording limit';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-4">
          <Logo variant="tiled" size="md" showText={false} />
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-semibold">Link copied, ready to share</DialogTitle>
            <div className="flex items-center gap-2">
              <DialogDescription className="text-sm text-muted-foreground">
                Share with anyone to capture their screen
              </DialogDescription>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={SUPPORT_LINKS.sharingLinks}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Learn more about sharing links</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={linkUrl}
            readOnly
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {showWarning && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {getWarningMessage(recordingLimitStatus)}
              </p>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        {showWarning && (
          <button
            type="button"
            onClick={handleUpgrade}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Upgrade
          </button>
        )}
        <Button variant="default" onClick={handleCopy} className="rounded-full px-6">
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      </DialogFooter>
    </>
  );
}
