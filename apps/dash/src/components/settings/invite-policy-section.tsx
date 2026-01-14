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
import { X, Globe, Lock, Shield } from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspace';
import { useInvitePolicy, type WorkspaceInvitePolicy } from '@/hooks/use-invite-policy';
import { useUpdateInvitePolicy } from '@/queries/use-workspace-mutations';
import { SectionError } from '@/components/shared/section-error';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { AddEmailDomainModal } from '@/components/modals/add-email-domain-modal';
import { MAX_EMAIL_DOMAINS } from '@workspace/contract';

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
  const updatePolicyMutation = useUpdateInvitePolicy();

  const [policy, setPolicy] = useState<WorkspaceInvitePolicy>('private');
  const [domains, setDomains] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);

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

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Access</h2>
          <p className="text-sm text-muted-foreground">
            Control how users can discover and join your workspace
          </p>
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
          <p className="text-sm text-muted-foreground">
            Control how users can discover and join your workspace
          </p>
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
        <p className="text-sm text-muted-foreground">
          Control how users can discover and join your workspace
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Policy Selection */}
        <div className="space-y-2">
          <Label>Invite Policy</Label>
          <p className="text-sm text-muted-foreground">Manage invite policy for your workspace</p>
          <Select value={policy} onValueChange={handlePolicyChange}>
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

            {/* Domain Cards */}
            {domains.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between p-6 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{domain}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:text-destructive"
                  onClick={() => handleRemoveDomain(domain)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add Domain Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddDomainModal(true)}
              disabled={isMaxDomainsReached}
            >
              {isMaxDomainsReached ? 'Maximum domains reached' : 'Add email domain'}
            </Button>

            <AddEmailDomainModal
              open={showAddDomainModal}
              onOpenChange={setShowAddDomainModal}
              onAdd={handleAddDomain}
              existingDomains={domains}
            />
          </div>
        )}

        {/* Save/Cancel Buttons */}
        {hasChanges && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updatePolicyMutation.isPending || needsDomains}>
              {updatePolicyMutation.isPending ? 'Saving...' : 'Save Changes'}
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
    </div>
  );
}
