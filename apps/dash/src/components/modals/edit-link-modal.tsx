'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { UrlInputWithFavicon } from '@/components/url-input-with-favicon';

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  reference?: string;
  isReusable: boolean;
  linkProvider?: string;
  linkProviderId?: string;
  onSave: (
    title: string,
    reference: string,
    isReusable: boolean,
    linkProvider?: string,
    linkProviderId?: string
  ) => void;
}

const LINK_PROVIDERS = [
  { id: 'intercom', name: 'Intercom' },
  { id: 'zendesk', name: 'Zendesk' },
  { id: 'jira', name: 'Jira' },
  { id: 'linear', name: 'Linear' },
  { id: 'slack', name: 'Slack' },
  { id: 'asana', name: 'Asana' },
  { id: 'github', name: 'GitHub' },
  { id: 'gitlab', name: 'GitLab' },
];

export function EditLinkModal({
  open,
  onOpenChange,
  title,
  reference = '',
  isReusable,
  linkProvider,
  linkProviderId,
  onSave,
}: EditLinkModalProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [editReference, setEditReference] = useState(reference);
  const [editIsReusable, setEditIsReusable] = useState(isReusable);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(linkProvider);
  const [providerId, setProviderId] = useState<string>(linkProviderId || '');

  useEffect(() => {
    if (open) {
      setEditTitle(title);
      setEditReference(reference);
      setEditIsReusable(isReusable);
      setSelectedProvider(linkProvider);
      setProviderId(linkProviderId || '');
      setShowAdvanced(false);
    }
  }, [open, title, reference, isReusable, linkProvider, linkProviderId]);

  const handleSave = () => {
    onSave(editTitle, editReference, editIsReusable, selectedProvider, providerId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <svg
                viewBox="0 0 512 512"
                className="h-8 w-8 shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Edit Recording Link</DialogTitle>
              <DialogDescription>
                Update the title and reusability settings for this recording link.
              </DialogDescription>
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
              <Input
                id="link-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter link title"
              />
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
              <UrlInputWithFavicon
                id="link-reference"
                value={editReference}
                onChange={setEditReference}
                placeholder="e.g. https://github.com/org/repo/issues/123, JIRA-456, Customer ABC"
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
                          className={selectedProvider ? 'text-foreground' : 'text-muted-foreground'}
                        >
                          {selectedProvider
                            ? LINK_PROVIDERS.find((p) => p.id === selectedProvider)?.name
                            : 'Select a provider'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[280px] overflow-y-auto">
                      {LINK_PROVIDERS.map((provider) => (
                        <DropdownMenuItem
                          key={provider.id}
                          onClick={() => setSelectedProvider(provider.id)}
                          className="cursor-pointer"
                        >
                          {provider.name}
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
                  <Input
                    id="provider-id"
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    placeholder="e.g., JIRA-123, #456, ticket-789"
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
                  <Switch
                    id="reusable"
                    checked={editIsReusable}
                    onCheckedChange={setEditIsReusable}
                  />
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-full px-6">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
