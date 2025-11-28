'use client';

import { useState } from 'react';
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
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface CreateLinkModalProps {
  onLinkCreated: (link: string) => void;
}

export function CreateLinkModal({ onLinkCreated }: CreateLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isReusable, setIsReusable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const projects = [
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' },
    { id: '3', name: 'Project 3' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedLink = `https://userplane.com/r/${Math.random().toString(36).substring(7)}`;
    onLinkCreated(generatedLink);
    setOpen(false);
    setReference('');
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
          <div className="space-y-6">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold">Create a link</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a recording link for customer
              </DialogDescription>
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
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      {projects.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          onClick={() => setSelectedProject(project.id)}
                          className="cursor-pointer"
                        >
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
