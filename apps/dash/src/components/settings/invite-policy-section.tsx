'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Globe, Lock, Plus, RefreshCw, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AddEmailDomainModal } from '@/components/modals/add-email-domain-modal';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';
import { SectionError } from '@/components/shared/section-error';
import { MAX_EMAIL_DOMAINS, WORKSPACE_INVITE_POLICY_OPTIONS } from '@/constants';
import {
  useCanEditWorkspace,
  useInvitePolicy,
  useRotateInvite,
  useUpdateInvitePolicy,
} from '@/features/workspace';
import { useWorkspaceId } from '@/stores/workspace';
import type { WorkspaceInvitePolicy } from '@/types';

const POLICY_OPTIONS = [
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[0]!, icon: Lock },
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[1]!, icon: Globe },
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[2]!, icon: Shield },
] as const;

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
  const [accordionValue, setAccordionValue] = useState('');
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
      domains: domains.length > 0 ? domains : null,
    });
    setAccordionValue('');
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
  const isMaxDomainsReached = domains.length >= MAX_EMAIL_DOMAINS;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Access</h2>
        <p className="text-sm text-muted-foreground">Manage workspace invite settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Invite Policy Accordion */}
        <div className="space-y-3">
          <div>
            <Label>Invite policy</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Control how people join your workspace
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="max-w-md"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value="policy" className="border rounded-lg overflow-hidden px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {selectedOption?.label ?? 'Invite policy'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedOption?.description}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-1">
                  <Select value={policy} onValueChange={handlePolicyChange} disabled={!canEdit}>
                    <SelectTrigger className="w-full">
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

                  {/* Domain Input */}
                  {showDomainInput && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {policy === 'whitelisted'
                          ? 'Users with these email domains can join directly.'
                          : 'Users with these email domains can request access.'}{' '}
                        ({domains.length}/{MAX_EMAIL_DOMAINS})
                      </p>

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
                  )}

                  {/* Save / Cancel */}
                  <div
                    className={`flex gap-2 pt-2 transition-opacity ${hasChanges && canEdit ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <button
                      onClick={handleSave}
                      disabled={updatePolicyMutation.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {updatePolicyMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updatePolicyMutation.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <AddEmailDomainModal
            open={showAddDomainModal}
            onOpenChange={setShowAddDomainModal}
            onAdd={handleAddDomain}
            existingDomains={domains}
          />
        </div>

        {/* Reset Invite Token */}
        <div className="space-y-3">
          <div>
            <Label>Reset invite token</Label>
            <p className="text-sm text-muted-foreground mt-1">
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
            <span className="text-sm text-muted-foreground">Rotate invite token</span>
          </button>
        </div>

        <ResetInviteTokenModal
          open={resetInviteModalOpen}
          onOpenChange={setResetInviteModalOpen}
          workspace={
            workspaceId
              ? {
                  workspaceId: workspaceId,
                  workspaceName: '',
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
