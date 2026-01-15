'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { X, Globe, Lock, Shield, Plus, RefreshCw } from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspace';
import { useInvitePolicy, type WorkspaceInvitePolicy } from '@/hooks/use-invite-policy';
import { useUpdateInvitePolicy } from '@/queries/use-workspace-mutations';
import { SectionError } from '@/components/shared/section-error';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { AddEmailDomainModal } from '@/components/modals/add-email-domain-modal';
import { MAX_EMAIL_DOMAINS } from '@workspace/contract';
import { useCanEditWorkspace } from '@/hooks/use-workspace-role';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';
import { useRotateInvite } from '@/queries/use-workspace-mutations';

const POLICY_OPTIONS = [
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Only explicit invites can grant access',
    icon: Lock,
  },
  {
    value: 'whitelisted' as const,
    label: 'Whitelisted',
    description: 'Users with matching email domains can join directly',
    icon: Globe,
  },
  {
    value: 'protected' as const,
    label: 'Protected',
    description: 'Users with matching domains can request access (owner approval required)',
    icon: Shield,
  },
];

function InvitePolicySkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full max-w-xs" />
    </div>
  );
}

export function InvitePolicySection() {
  const workspaceId = useWorkspaceId();
  const { data: policyResult, isLoading, error, refetch } = useInvitePolicy();
  const { canEdit, isLoading: isLoadingRole } = useCanEditWorkspace();

  const [policy, setPolicy] = useState<WorkspaceInvitePolicy>('private');
  const [domains, setDomains] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [resetInviteModalOpen, setResetInviteModalOpen] = useState(false);

  const updatePolicyMutation = useUpdateInvitePolicy({
    onSuccess: () => setHasChanges(false),
  });
  const rotateInviteMutation = useRotateInvite();

  const handleResetInviteToken = () => {
    setResetInviteModalOpen(true);
  };

  const handleConfirmResetInviteToken = () => {
    if (!workspaceId) return;
    rotateInviteMutation.mutate(workspaceId);
    setResetInviteModalOpen(false);
  };

  // Sync state with fetched data
  useEffect(() => {
    if (policyResult?.success) {
      setPolicy(policyResult.data.workspaceInvitePolicy);
      setDomains(policyResult.data.workspaceInviteDomains || []);
      setHasChanges(false);
    }
  }, [policyResult]);

  const handlePolicyChange = (newPolicy: WorkspaceInvitePolicy) => {
    setPolicy(newPolicy);
    // Clear domains when switching to private
    if (newPolicy === 'private') {
      setDomains([]);
    }
    setHasChanges(true);
  };

  const handleAddDomain = (domain: string) => {
    if (domain && !domains.includes(domain)) {
      setDomains([...domains, domain]);
      setHasChanges(true);
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains(domains.filter((d) => d !== domainToRemove));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!workspaceId) return;

    updatePolicyMutation.mutate({
      workspaceId,
      policy,
      domains: policy === 'private' ? null : domains.length > 0 ? domains : null,
    });
  };

  const handleCancel = () => {
    if (policyResult?.success) {
      setPolicy(policyResult.data.workspaceInvitePolicy);
      setDomains(policyResult.data.workspaceInviteDomains || []);
      setHasChanges(false);
    }
  };

  if (isLoading || isLoadingRole) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Access</h2>
          <p className="text-sm text-muted-foreground">Manage workspace invite settings</p>
        </div>
        <div className="max-w-2xl">
          <InvitePolicySkeleton />
        </div>
      </div>
    );
  }

  if (error || (policyResult && !policyResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Access</h2>
          <p className="text-sm text-muted-foreground">Manage workspace invite settings</p>
        </div>
        <div className="max-w-2xl">
          <SectionError
            title="Failed to load invite policy"
            description={
              error instanceof Error
                ? error.message
                : policyResult && !policyResult.success
                  ? policyResult.error.message
                  : 'Something went wrong while loading invite policy settings.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const selectedOption = POLICY_OPTIONS.find((opt) => opt.value === policy);
  const showDomainInput = policy !== 'private';
  const needsDomains = policy !== 'private' && domains.length === 0;
  const isMaxDomainsReached = domains.length >= MAX_EMAIL_DOMAINS;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Access</h2>
        <p className="text-sm text-muted-foreground">Manage workspace invite settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Policy Selection */}
        <div className="space-y-2">
          <Label>Invite Policy</Label>
          <p className="text-sm text-muted-foreground">Set invite policy for your workspace</p>

          <div className="flex items-center gap-4">
            <Select value={policy} onValueChange={handlePolicyChange} disabled={!canEdit}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                {POLICY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasChanges && canEdit && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updatePolicyMutation.isPending || needsDomains}
                >
                  {updatePolicyMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updatePolicyMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {selectedOption && (
            <p className="text-sm text-muted-foreground">{selectedOption.description}</p>
          )}
        </div>

        {/* Domain Input */}
        {showDomainInput && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Allowed Email Domains</Label>
              <p className="text-sm text-muted-foreground">
                {policy === 'whitelisted'
                  ? 'Users with these email domains can join the workspace directly.'
                  : 'Users with these email domains can request access to the workspace.'}{' '}
                ({domains.length}/{MAX_EMAIL_DOMAINS})
              </p>
            </div>

            {/* Domain Input Fields */}
            <div className="space-y-3 max-w-md">
              {domains.map((domain) => (
                <div
                  key={domain}
                  className={`flex items-center gap-2 p-3 rounded-lg border bg-background ${!canEdit ? 'opacity-50' : ''}`}
                >
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={domain}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-foreground outline-none cursor-default"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:text-destructive shrink-0"
                    onClick={() => handleRemoveDomain(domain)}
                    disabled={!canEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add Domain Input */}
              {canEdit && (
                <button
                  onClick={() => setShowAddDomainModal(true)}
                  disabled={isMaxDomainsReached}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
                    isMaxDomainsReached
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:border-primary/50'
                  }`}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isMaxDomainsReached ? 'Maximum domains reached' : 'Add email domain'}
                  </span>
                </button>
              )}
            </div>

            <AddEmailDomainModal
              open={showAddDomainModal}
              onOpenChange={setShowAddDomainModal}
              onAdd={handleAddDomain}
              existingDomains={domains}
            />
          </div>
        )}

        <div className="mt-6">
          <div className="space-y-1 mb-3">
            <Label>Reset invite token</Label>
            <p className="text-sm text-muted-foreground">
              Generate a new invite token and invalidate the old one
            </p>
          </div>
          <button
            onClick={handleResetInviteToken}
            disabled={rotateInviteMutation.isPending || !canEdit}
            className={`w-full max-w-md flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors ${
              rotateInviteMutation.isPending || !canEdit
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-primary/50'
            }`}
          >
            <RefreshCw
              className={`h-4 w-4 text-muted-foreground ${rotateInviteMutation.isPending ? 'animate-spin' : ''}`}
            />
            <span className="text-sm text-muted-foreground">
              {rotateInviteMutation.isPending ? 'Rotate invite token' : 'Rotate invite token'}
            </span>
          </button>
        </div>

        <ResetInviteTokenModal
          open={resetInviteModalOpen}
          onOpenChange={setResetInviteModalOpen}
          workspace={
            workspaceId
              ? {
                  workspaceId: workspaceId,
                  workspaceName: '', // Name not strictly needed for this modal context or can be fetched if required
                }
              : null
          }
          onConfirm={handleConfirmResetInviteToken}
          isPending={rotateInviteMutation.isPending}
        />
      </div>
    </div>
  );
}
