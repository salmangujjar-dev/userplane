'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
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
import { Plus, ChevronDown, ChevronUp, ExternalLink, Check } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace';

interface CreateLinkModalProps {
  onLinkCreated: (link: string) => void;
}

export function CreateLinkModal({ onLinkCreated }: CreateLinkModalProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isReusable, setIsReusable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const domains = [
    { id: '1', name: 'userplane.com', url: 'https://userplane.com', isLogEnabled: true },
    { id: '2', name: 'app.userplane.com', url: 'https://app.userplane.com', isLogEnabled: true },
    { id: '3', name: 'custom.domain.com', url: 'https://custom.domain.com', isLogEnabled: false },
  ];

  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(domains[0]?.id);

  // TODO: Replace with actual API call to fetch projects for the workspace
  // Example: const { data: projects } = useQuery(['projects', workspaceId], () => fetchProjects(workspaceId));
  const projects = [
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' },
    { id: '3', name: 'Project 3' },
  ];

  // Effect to fetch projects when modal opens and workspaceId is available
  useEffect(() => {
    if (open && workspaceId) {
      // TODO: Fetch projects for this workspace
      // fetchProjects(workspaceId);
      console.log('Fetching projects for workspace:', workspaceId);
    }
  }, [open, workspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDomainUrl =
      domains.find((d) => d.id === selectedDomain)?.url || 'https://userplane.com';
    const generatedLink = `${selectedDomainUrl}/r/${Math.random().toString(36).substring(7)}`;
    onLinkCreated(generatedLink);
    setOpen(false);
    setReference('');
    setSelectedDomain(domains[0]?.id);
    setSelectedProject('');
    setIsReusable(false);
    setShowAdvanced(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="rounded-full">
          Create Link
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <svg
                  viewBox="0 0 512 512"
                  className="h-8 w-8 flex-shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
                </svg>
              </div>

              <div className="text-center space-y-1">
                <DialogTitle className="text-xl font-semibold">Create a link</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Create a recording link for customer
                </DialogDescription>
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
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. https://github.com/org/repo/issues/123, JIRA-456, Customer ABC"
                className="w-full rounded-lg bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {domains.length > 0 && selectedDomain && (
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
                    >
                      <span className="text-foreground">
                        {domains.find((d) => d.id === selectedDomain)?.name || 'Select a domain'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                    {domains.map((domain) => (
                      <DropdownMenuItem
                        key={domain.id}
                        onClick={() => setSelectedDomain(domain.id)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <span>{domain.name}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-help">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                  Log Capture
                                </span>
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    domain.isLogEnabled
                                      ? 'bg-green-500 shadow-[0_0_4px_1px_rgba(34,197,94,0.5)]'
                                      : 'bg-yellow-500 shadow-[0_0_4px_1px_rgba(234,179,8,0.5)]'
                                  }`}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="flex items-center gap-1.5">
                                {domain.isLogEnabled ? (
                                  <>
                                    Log capture enabled
                                    <Check className="h-3 w-3 inline-block" />
                                  </>
                                ) : (
                                  <>
                                    Enable log capture
                                    <ExternalLink className="h-3 w-3 inline-block" />
                                  </>
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {showAdvanced && (
              <div className="space-y-5 pt-5 border-t">
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
                        <span
                          className={selectedProject ? 'text-foreground' : 'text-muted-foreground'}
                        >
                          {selectedProject
                            ? projects.find((p) => p.id === selectedProject)?.title
                            : 'Select a project'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                      {projects.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          onClick={() => setSelectedProject(project.id)}
                          className="cursor-pointer"
                        >
                          {project.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

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
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full px-6">
                Create Link
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
