'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
import { Globe, Lock, Plus, Shield, X } from 'lucide-react';
import { useState } from 'react';

import { AddEmailDomainModal } from '@/components/modals/add-email-domain-modal';
import { MAX_EMAIL_DOMAINS, WORKSPACE_INVITE_POLICY_OPTIONS } from '@/constants';
import type { WorkspaceInvitePolicy } from '@/types';

const POLICY_OPTIONS = [
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[0]!, icon: Lock },
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[1]!, icon: Globe },
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[2]!, icon: Shield },
] as const;

interface InvitePolicyTabProps {
  policy: WorkspaceInvitePolicy;
  domains: string[];
  onPolicyChange: (policy: WorkspaceInvitePolicy) => void;
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
}

/**
 * Tab content for configuring workspace invite policy and allowed email domains.
 * Used in both the OAuth callback flow and the settings invite page.
 */
export function InvitePolicyTab({
  policy,
  domains,
  onPolicyChange,
  onAddDomain,
  onRemoveDomain,
}: InvitePolicyTabProps) {
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);

  const selectedOption = POLICY_OPTIONS.find((opt) => opt.value === policy);
  const showDomainInput = policy !== 'private';
  const isMaxDomainsReached = domains.length >= MAX_EMAIL_DOMAINS;

  return (
    <div className="space-y-6">
      {/* Policy Selection */}
      <div className="space-y-3">
        <div>
          <label id="invite-policy-label" htmlFor="invite-policy" className="text-sm font-medium">
            Invite Policy
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control how teammates can join your workspace
          </p>
        </div>
        <Select value={policy} onValueChange={onPolicyChange}>
          <SelectTrigger
            id="invite-policy"
            className="w-full"
            aria-labelledby="invite-policy-label"
          >
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
          <p className="text-xs text-muted-foreground">{selectedOption.description}</p>
        )}
      </div>

      {/* Domain Management */}
      {showDomainInput && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span id="allowed-email-domains-label" className="text-sm font-medium">
                Allowed Email Domains
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {policy === 'whitelisted'
                  ? 'Users with these email domains can join directly'
                  : 'Users with these email domains can request access'}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {domains.length}/{MAX_EMAIL_DOMAINS}
            </span>
          </div>

          {/* Scrollable domains container with fixed max height */}
          <div
            className="max-h-[140px] overflow-y-auto space-y-2 pr-1"
            role="list"
            aria-labelledby="allowed-email-domains-label"
          >
            {domains.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">No domains added yet</p>
              </div>
            ) : (
              domains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-muted/30"
                >
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-mono">@{domain}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveDomain(domain)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {!isMaxDomainsReached && (
            <button
              type="button"
              onClick={() => setShowAddDomainModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add domain</span>
            </button>
          )}
        </div>
      )}

      <AddEmailDomainModal
        open={showAddDomainModal}
        onOpenChange={setShowAddDomainModal}
        onAdd={onAddDomain}
        existingDomains={domains}
      />
    </div>
  );
}
