import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Label } from '@userplane/ui/components/label';
import { Switch } from '@userplane/ui/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { ChevronDown, FolderKanban, Globe, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Control, UseFormHandleSubmit, UseFormSetValue } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DinoError } from '@/components/shared/dino-error';
import { LinkReferenceInput } from '@/components/shared/link-reference-input';
import { FormFieldSkeleton } from '@/components/shared/skeletons';
import { SUPPORT_LINKS } from '@/constants';
import { useWorkspaceDomains } from '@/features/domains';
import { useCreateLink } from '@/features/links';
import { useWorkspaceProjects } from '@/features/projects';
import type { ActiveTabResponse } from '@/lib/messaging';
import { sendMessage } from '@/lib/messaging';
import { useAutoPopulateUrl } from '@/stores/settings';
import { useWorkspaceStore } from '@/stores/workspace';

const createLinkFormSchema = z.object({
  reference: z.string().optional(),
  domainId: z.string().min(1, 'Please select a domain'),
  projectId: z.string().optional(),
  isReusable: z.boolean(),
});

type CreateLinkFormValues = z.infer<typeof createLinkFormSchema>;

type ViewState = { view: 'create' } | { view: 'error'; error: { message: string; code?: string } };

export function CreateLinkView() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const navigate = useNavigate();
  const [state, setState] = useState<ViewState>({ view: 'create' });
  const autoPopulateUrl = useAutoPopulateUrl();

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

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      const defaultProject = projects.find((p) => p.isDefault) || projects[0];
      if (defaultProject) {
        setValue('projectId', defaultProject.projectId);
      }
    }
  }, [projects, selectedProject, setValue]);

  useEffect(() => {
    if (domains && domains.length > 0 && !selectedDomain) {
      const verifiedDomain = domains.find((d) => d.domainStatus === 'verified') || domains[0];
      if (verifiedDomain) {
        setValue('domainId', verifiedDomain.domainId, { shouldValidate: true });
      }
    }
  }, [domains, selectedDomain, setValue]);

  // Auto-populate link reference with current page URL
  useEffect(() => {
    if (!autoPopulateUrl) return;
    sendMessage<ActiveTabResponse>({ type: 'GET_ACTIVE_TAB_URL' }).then((response) => {
      if (response?.url) {
        setValue('reference', response.url);
      }
    });
  }, [autoPopulateUrl, setValue]);

  const onSubmit = (data: CreateLinkFormValues) => {
    createLinkMutation.mutate(
      {
        domainId: data.domainId,
        projectId: data.projectId || undefined,
        linkReference: data.reference || undefined,
        linkReusable: data.isReusable,
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
          navigate({
            to: '/share',
            search: { linkUrl: result.data.link.linkURL },
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

  const handleReset = () => {
    reset();
    setState({ view: 'create' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Create Link</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">Create a recording link for customer</p>
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

      {state.view === 'create' && (
        <div className="flex-1 overflow-y-auto p-4">
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
            isPending={createLinkMutation.isPending}
            isValid={isValid}
          />
        </div>
      )}
      {state.view === 'error' && (
        <div className="flex-1 flex items-center justify-center">
          <DinoError
            title="Unable to Create Link"
            description={state.error.message || 'An error occurred while creating the link.'}
            primaryAction={{ label: 'Try Again', onClick: handleReset }}
            secondaryAction={{
              label: 'Learn More',
              onClick: () => window.open(SUPPORT_LINKS.linkCreationErrors, '_blank'),
            }}
          />
        </div>
      )}
    </div>
  );
}

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
  isPending: boolean;
  isValid: boolean;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
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

        {isLoadingDomains ? (
          <div className="space-y-2.5">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Domain</Label>
              <p className="text-xs text-muted-foreground">
                Select the domain for your recording link
              </p>
            </div>
            <FormFieldSkeleton />
          </div>
        ) : domains && domains.length > 0 ? (
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
        ) : null}

        {isLoadingProjects ? (
          <div className="space-y-2.5">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Project</Label>
              <p className="text-xs text-muted-foreground">
                Associate this link with a specific project
              </p>
            </div>
            <FormFieldSkeleton />
          </div>
        ) : projects && projects.length > 0 ? (
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
                >
                  <span className={selectedProject ? 'text-foreground' : 'text-muted-foreground'}>
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
        ) : null}

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
        {isLoadingDomains ? (
          <FormFieldSkeleton />
        ) : (
          <Button type="submit" className="px-6" disabled={isPending || !isValid}>
            {isPending ? 'Creating...' : 'Create Link'}
          </Button>
        )}
      </div>
    </form>
  );
}
