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

interface CreateLinkModalProps {
  onLinkCreated: (link: string) => void;
}

const DOMAINS = [
  { id: '1', name: 'userplane.com', url: 'https://userplane.com' },
  { id: '2', name: 'app.userplane.com', url: 'https://app.userplane.com' },
  { id: '3', name: 'custom.domain.com', url: 'https://custom.domain.com' },
];

export function CreateLinkModal({ onLinkCreated }: CreateLinkModalProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isReusable, setIsReusable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(DOMAINS[0]?.id);

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

  // Effect to reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setReference('');
      setSelectedDomain(DOMAINS[0]?.id);
      setSelectedProject('');
      setIsReusable(false);
      setShowAdvanced(false);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDomainUrl =
      DOMAINS.find((d) => d.id === selectedDomain)?.url || 'https://userplane.com';
    const generatedLink = `${selectedDomainUrl}/r/${Math.random().toString(36).substring(7)}`;
    onLinkCreated(generatedLink);
    setOpen(false);
    setReference('');
    setSelectedDomain(DOMAINS[0]?.id);
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
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Create a link</DialogTitle>
                <div className="flex items-center gap-1.5">
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

            {DOMAINS.length > 0 && selectedDomain && (
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
                        {DOMAINS.find((d) => d.id === selectedDomain)?.name || 'Select a domain'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                    {DOMAINS.map((domain) => (
                      <DropdownMenuItem
                        key={domain.id}
                        onClick={() => setSelectedDomain(domain.id)}
                        className="cursor-pointer"
                      >
                        <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        {domain.name}
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
                            ? projects.find((p) => p.id === selectedProject)?.name
                            : 'Select a project'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                      {projects.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          onClick={() => setSelectedProject(project.id)}
                          className="cursor-pointer"
                        >
                          <FolderKanban className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          {project.name}
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
