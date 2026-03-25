'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@userplane/ui/components/accordion';
import { Button } from '@userplane/ui/components/button';
import { Label } from '@userplane/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
import { Skeleton } from '@userplane/ui/components/skeleton';
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

  const [formState, setFormState] = useState({
    policy: 'private' as WorkspaceInvitePolicy,
    domains: [] as string[],
    hasChanges: false,
  });
  const [uiState, setUiState] = useState({
    showAddDomainModal: false,
    accordionValue: '',
    resetInviteModalOpen: false,
  });

  const updatePolicyMutation = useUpdateInvitePolicy({
    onSuccess: () => setFormState((prev) => ({ ...prev, hasChanges: false })),
  });
  const rotateInviteMutation = useRotateInvite();

  const handleResetInviteToken = () => {
    setUiState((prev) => ({ ...prev, resetInviteModalOpen: true }));
  };

  const handleConfirmResetInviteToken = () => {
    if (!workspaceId) return;
    rotateInviteMutation.mutate(workspaceId);
    setUiState((prev) => ({ ...prev, resetInviteModalOpen: false }));
  };

  // Sync state with fetched data
  useEffect(() => {
    if (policyResult?.success) {
      setFormState({
        policy: policyResult.data.workspaceInvitePolicy,
        domains: policyResult.data.workspaceInviteDomains || [],
        hasChanges: false,
      });
    }
  }, [policyResult]);

  const handlePolicyChange = (newPolicy: WorkspaceInvitePolicy) => {
    setFormState((prev) => ({ ...prev, policy: newPolicy, hasChanges: true }));
  };

  const handleAddDomain = (domain: string) => {
    if (domain && !formState.domains.includes(domain)) {
      setFormState((prev) => ({ ...prev, domains: [...prev.domains, domain], hasChanges: true }));
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setFormState((prev) => ({
      ...prev,
      domains: prev.domains.filter((d) => d !== domainToRemove),
      hasChanges: true,
    }));
  };

  const handleSave = () => {
    if (!workspaceId) return;

    updatePolicyMutation.mutate({
      workspaceId,
      policy: formState.policy,
      domains: formState.domains.length > 0 ? formState.domains : null,
    });
    setUiState((prev) => ({ ...prev, accordionValue: '' }));
  };

  const handleCancel = () => {
    if (policyResult?.success) {
      setFormState({
        policy: policyResult.data.workspaceInvitePolicy,
        domains: policyResult.data.workspaceInviteDomains || [],
        hasChanges: false,
      });
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

  const selectedOption = POLICY_OPTIONS.find((opt) => opt.value === formState.policy);
  const showDomainInput = formState.policy !== 'private';
  const isMaxDomainsReached = formState.domains.length >= MAX_EMAIL_DOMAINS;

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
            value={uiState.accordionValue}
            onValueChange={(value) => setUiState((prev) => ({ ...prev, accordionValue: value }))}
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
                  <Select
                    value={formState.policy}
                    onValueChange={handlePolicyChange}
                    disabled={!canEdit}
                  >
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
                        {formState.policy === 'whitelisted'
                          ? 'Users with these email domains can join directly.'
                          : 'Users with these email domains can request access.'}{' '}
                        ({formState.domains.length}/{MAX_EMAIL_DOMAINS})
                      </p>

                      {formState.domains.map((domain) => (
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
                          onClick={() =>
                            setUiState((prev) => ({ ...prev, showAddDomainModal: true }))
                          }
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
                    className={`flex gap-2 pt-2 transition-opacity ${formState.hasChanges && canEdit ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <button
                      onClick={handleSave}
                      disabled={updatePolicyMutation.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {updatePolicyMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updatePolicyMutation.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <AddEmailDomainModal
            open={uiState.showAddDomainModal}
            onOpenChange={(open) => setUiState((prev) => ({ ...prev, showAddDomainModal: open }))}
            onAdd={handleAddDomain}
            existingDomains={formState.domains}
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
          open={uiState.resetInviteModalOpen}
          onOpenChange={(open) => setUiState((prev) => ({ ...prev, resetInviteModalOpen: open }))}
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
