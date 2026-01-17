'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import Logo from '@workspace/ui/components/logo';
import { LinkIcon, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { URLInput } from '@/components/url-input';
import { PLAN_OPTIONS } from './hooks/use-provision-form';
import type { AdminWorkspaceCreateInviteResponse } from '@/hooks/use-admin-workspace-api';
import { toast } from '@workspace/ui/components/sonner';

import type { PlanId } from '@workspace/pricing';

interface AdminCreateWorkspaceInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { workspaceUrl: string; plan?: PlanId }) => void;
  isPending: boolean;
}

interface AdminCreateWorkspaceInviteSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AdminWorkspaceCreateInviteResponse | null;
}

/**
 * Modal for creating a workspace invite URL.
 * Allows admin to specify workspace URL and optional plan.
 */
export function AdminCreateWorkspaceInviteModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AdminCreateWorkspaceInviteModalProps) {
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [workspacePlan, setWorkspacePlan] = useState<PlanId>('sandbox');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setWorkspaceUrl('');
      setWorkspacePlan('sandbox');
      setShowAdvanced(false);
    }
  }, [open]);

  const isValid = workspaceUrl.trim() !== '' && workspaceUrl.startsWith('http');

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ workspaceUrl, plan: workspacePlan });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Create Workspace Invite</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Generate an invite URL for workspace creation
              </DialogDescription>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="space-y-0.5">
                <Label htmlFor="workspace-url" className="text-sm font-medium">
                  Domain URL
                </Label>
                <p className="text-xs text-muted-foreground">
                  The domain URL that will be associated with the workspace
                </p>
              </div>
              <URLInput
                id="workspace-url"
                value={workspaceUrl}
                onChange={setWorkspaceUrl}
                placeholder="example.com"
              />
            </div>

            {showAdvanced && (
              <div className="space-y-5 pt-5 border-t">
                <div className="space-y-2.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="workspace-plan" className="text-sm font-medium">
                      Workspace Plan
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Leave as Sandbox for trial workspaces
                    </p>
                  </div>
                  <Select
                    value={workspacePlan}
                    onValueChange={(value) => setWorkspacePlan(value as PlanId)}
                    disabled={isPending}
                  >
                    <SelectTrigger id="workspace-plan" className="rounded-lg">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Default)</SelectItem>
                      {PLAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
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
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isPending}
                className="rounded-full px-6"
              >
                {isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Generate Invite
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Success modal displaying the generated workspace invite URL
 */
export function AdminCreateWorkspaceInviteSuccessModal({
  open,
  onOpenChange,
  result,
}: AdminCreateWorkspaceInviteSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset advanced view when modal closes
  useEffect(() => {
    if (!open) {
      setShowAdvanced(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!result?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">
                Invite Created Successfully
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Share this invite URL to provision the workspace
              </DialogDescription>
            </div>
          </div>

          {/* Invite URL */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Invite URL</Label>
                <p className="text-xs text-muted-foreground">
                  Share this URL to provision the workspace
                </p>
              </div>
              <input
                type="text"
                value={result.inviteUrl}
                readOnly
                className="w-full rounded-lg border bg-muted px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">The invite token is valid for 7 days</p>
            </div>

            {showAdvanced && (
              <div className="space-y-3 pt-5 border-t">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Workspace ID</p>
                  <p className="text-sm font-mono break-all">{result.workspaceId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Domain URL</p>
                  <p className="text-sm break-all">{result.workspaceUrl}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Plan</p>
                  <p className="text-sm capitalize">{result.workspacePlan}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Details
                </>
              )}
            </button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-6"
              >
                Done
              </Button>
              <Button onClick={handleCopy} className="rounded-full px-6 w-[140px]">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
