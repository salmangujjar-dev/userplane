'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Plus, ChevronDown, ChevronUp, HelpCircle, Globe, FolderKanban } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace';
import { UrlInputWithFavicon } from '@/components/url-input-with-favicon';
import { useWorkspaceProjects } from '@/hooks/use-workspace-projects';
import { useWorkspaceDomains } from '@/hooks/use-workspace-domains';
import { useCreateLink } from '@/queries/use-link-mutations';
import { toast } from '@workspace/ui/components/sonner';

interface CreateLinkModalProps {
  onLinkCreated?: (linkUrl: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideButton?: boolean;
  defaultProjectId?: string;
}

export function CreateLinkModal({
  onLinkCreated,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideButton = false,
  defaultProjectId,
}: CreateLinkModalProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [reference, setReference] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isReusable, setIsReusable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');

  const { data: projectsResult, isLoading: isLoadingProjects } = useWorkspaceProjects({
    perPage: 10,
  });

  const { data: domainsResult, isLoading: isLoadingDomains } = useWorkspaceDomains({
    perPage: 10,
  });

  const projects = projectsResult?.success ? projectsResult.data.projects : undefined;
  const domains = domainsResult?.success ? domainsResult.data.domains : undefined;

  const createLinkMutation = useCreateLink(workspaceId, domains);

  // Effect to set default project and domain when data loads
  useEffect(() => {
    if (open && projects && projects.length > 0 && !selectedProject) {
      // Use defaultProjectId if provided and exists in projects list
      if (defaultProjectId) {
        const projectExists = projects.some((p) => p.projectId === defaultProjectId);
        if (projectExists) {
          setSelectedProject(defaultProjectId);
          return;
        }
      }
      // Fall back to default project or first project
      const defaultProject = projects.find((p) => p.isDefault) || projects[0];
      if (defaultProject) {
        setSelectedProject(defaultProject.projectId);
      }
    }
  }, [open, projects, selectedProject, defaultProjectId]);

  useEffect(() => {
    if (open && domains && domains.length > 0 && !selectedDomain) {
      const verifiedDomain = domains.find((d) => d.domainStatus === 'verified') || domains[0];
      if (verifiedDomain) {
        setSelectedDomain(verifiedDomain.domainId);
      }
    }
  }, [open, domains, selectedDomain]);

  // Effect to reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setReference('');
      setSelectedDomain('');
      setSelectedProject('');
      setIsReusable(false);
      setShowAdvanced(false);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDomain) {
      toast.error('Please select a domain');
      return;
    }

    createLinkMutation.mutate(
      {
        domainId: selectedDomain,
        projectId: selectedProject || undefined,
        linkReference: reference || undefined,
        linkReusable: isReusable,
      },
      {
        onSuccess: (result) => {
          // Error already handled by mutation's onSuccess
          if (!result.success) return;

          if (onLinkCreated) {
            onLinkCreated(result.data.link.linkURL);
          }
          setOpen(false);
        },
      }
    );
  };

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
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit}>
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
                          href="https://userplane.com/docs/recording-links"
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
              <UrlInputWithFavicon
                id="reference"
                value={reference}
                onChange={setReference}
                placeholder="e.g. https://github.com/org/repo/issues/123, JIRA-456, Customer ABC"
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
                        onClick={() => setSelectedDomain(domain.domainId)}
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
                            className={
                              selectedProject ? 'text-foreground' : 'text-muted-foreground'
                            }
                          >
                            {selectedProject
                              ? projects.find((p) => p.projectId === selectedProject)
                                  ?.projectTitle || 'Untitled Project'
                              : 'Select a project'}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                        {projects.map((project) => (
                          <DropdownMenuItem
                            key={project.projectId}
                            onClick={() => setSelectedProject(project.projectId)}
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
                  <Switch id="reusable" checked={isReusable} onCheckedChange={setIsReusable} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
              disabled={createLinkMutation.isPending}
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
                onClick={() => setOpen(false)}
                disabled={createLinkMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full px-6"
                disabled={createLinkMutation.isPending || !selectedDomain}
              >
                {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
