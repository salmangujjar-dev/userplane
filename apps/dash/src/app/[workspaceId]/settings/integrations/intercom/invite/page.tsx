'use client';

import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import Logo from '@workspace/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { toast } from '@workspace/ui/components/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ArrowLeftRight, Globe, Loader2, Lock, Plus, Shield, X } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { AddEmailDomainModal } from '@/components/modals/add-email-domain-modal';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { MAX_EMAIL_DOMAINS, WORKSPACE_INVITE_POLICY_OPTIONS } from '@/constants';
import { useIntercomAdmins } from '@/features/integrations';
import { useSendWorkspaceInvites, useUpdateInvitePolicy } from '@/features/workspace';
import { showErrorToast } from '@/lib/errors';
import type { WorkspaceInvitePolicy } from '@/types';

const ITEMS_PER_PAGE = 5;

function LoadingState() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Invite your teammates</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select team members from Intercom to invite to your workspace
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="border rounded-lg divide-y">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-full" />
          <div className="flex justify-center">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">All teammates invited</h1>
            <p className="text-sm text-muted-foreground text-center">
              All your Intercom team members are already part of this workspace.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push(`/${workspaceId}/settings`)}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  workspaceId,
  message,
  onRetry,
}: {
  workspaceId: string;
  message: string;
  onRetry: () => void;
}) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Failed to load teammates</h1>
            <p className="text-sm text-muted-foreground text-center">{message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={onRetry} size="lg" className="w-full rounded-full px-7 py-6">
            Try Again
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push(`/${workspaceId}/settings`)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Admin {
  id: string;
  email: string;
  name: string | null;
}

interface InvitePolicyInfo {
  invitePolicy: 'private' | 'whitelisted' | 'protected';
  allowedDomains: string[] | null;
}

const AUTO_SELECT_LIMIT = 5;

const POLICY_OPTIONS = [
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[0]!, icon: Lock },
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[1]!, icon: Globe },
  { ...WORKSPACE_INVITE_POLICY_OPTIONS[2]!, icon: Shield },
] as const;

function InvitePolicyTab({
  policy,
  domains,
  onPolicyChange,
  onAddDomain,
  onRemoveDomain,
}: {
  policy: WorkspaceInvitePolicy;
  domains: string[];
  onPolicyChange: (policy: WorkspaceInvitePolicy) => void;
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
}) {
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);

  const selectedOption = POLICY_OPTIONS.find((opt) => opt.value === policy);
  const showDomainInput = policy !== 'private';
  const isMaxDomainsReached = domains.length >= MAX_EMAIL_DOMAINS;

  return (
    <div className="space-y-6">
      {/* Policy Selection */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Invite Policy</label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control how teammates can join your workspace
          </p>
        </div>
        <Select value={policy} onValueChange={onPolicyChange}>
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
        {selectedOption && (
          <p className="text-xs text-muted-foreground">{selectedOption.description}</p>
        )}
      </div>

      {/* Domain Management */}
      {showDomainInput && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Allowed Email Domains</label>
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
          <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
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

function AdminSelectionState({
  workspaceId,
  admins,
  invitePolicy: initialPolicy,
  allowedDomains: initialDomains,
}: {
  workspaceId: string;
  admins: Admin[];
  invitePolicy: InvitePolicyInfo['invitePolicy'];
  allowedDomains: InvitePolicyInfo['allowedDomains'];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('teammates');

  // Admin selection state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() => {
    const initialSelection = admins.slice(0, AUTO_SELECT_LIMIT).map((a) => a.email);
    return new Set(initialSelection);
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Policy state (lifted up from InvitePolicyTab)
  const [policy, setPolicy] = useState<WorkspaceInvitePolicy>(initialPolicy);
  const [domains, setDomains] = useState<string[]>(initialDomains || []);

  // Mutations
  const sendInvites = useSendWorkspaceInvites();
  const updatePolicyMutation = useUpdateInvitePolicy();

  // Sync policy state with initial values
  useEffect(() => {
    setPolicy(initialPolicy);
    setDomains(initialDomains || []);
  }, [initialPolicy, initialDomains]);

  // Check if policy has changes
  const hasPolicyChanges = useMemo(() => {
    const policyChanged = policy !== initialPolicy;
    const domainsChanged =
      JSON.stringify(domains.sort()) !== JSON.stringify((initialDomains || []).sort());
    return policyChanged || domainsChanged;
  }, [policy, domains, initialPolicy, initialDomains]);

  // Validation
  const needsDomains = policy !== 'private' && domains.length === 0;
  const isProcessing = sendInvites.isPending || updatePolicyMutation.isPending;

  const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return admins.slice(start, start + ITEMS_PER_PAGE);
  }, [admins, currentPage]);

  const allSelected = admins.length > 0 && selectedEmails.size === admins.length;

  const handleToggleAdmin = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(admins.map((a) => a.email)));
    }
  };

  const handlePolicyChange = (newPolicy: WorkspaceInvitePolicy) => {
    setPolicy(newPolicy);
    if (newPolicy === 'private') {
      setDomains([]);
    }
  };

  const handleAddDomain = (domain: string) => {
    if (domain && !domains.includes(domain)) {
      setDomains([...domains, domain]);
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains(domains.filter((d) => d !== domainToRemove));
  };

  // Main action: save policy changes (if any) then send invites
  const handleLetsGo = async () => {
    const emails = Array.from(selectedEmails);
    if (emails.length === 0) return;

    // If policy has changes, save them first
    if (hasPolicyChanges) {
      updatePolicyMutation.mutate(
        {
          workspaceId,
          policy,
          domains: policy === 'private' ? null : domains.length > 0 ? domains : null,
        },
        {
          onSuccess: (result) => {
            if (!result.success) {
              showErrorToast(result.error);
              return;
            }
            // Policy saved, now send invites
            sendInvitesAndRedirect(emails);
          },
        }
      );
    } else {
      // No policy changes, just send invites
      sendInvitesAndRedirect(emails);
    }
  };

  const sendInvitesAndRedirect = (emails: string[]) => {
    sendInvites.mutate(emails, {
      onSuccess: (result) => {
        if (!result.success) {
          showErrorToast(result.error);
          return;
        }
        toast.success(`Invites sent to ${emails.length} teammate${emails.length > 1 ? 's' : ''}`);
        router.push(`/${workspaceId}/settings`);
      },
    });
  };

  const handleSkip = () => {
    router.push(`/${workspaceId}/settings`);
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Invite your teammates</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select team members from Intercom to invite to your workspace
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="teammates">Teammates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Fixed height container to prevent layout shifts between tabs */}
          <div className="h-[340px] mt-4">
            <TabsContent value="teammates" className="mt-0 h-full flex flex-col">
              <div className="flex items-center justify-between px-1 mb-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedEmails.size} of {admins.length} selected
                </span>
              </div>

              <div className="border rounded-lg divide-y flex-1 overflow-y-auto">
                {paginatedAdmins.map((admin) => (
                  <label
                    key={admin.id}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedEmails.has(admin.email)}
                      onCheckedChange={() => handleToggleAdmin(admin.email)}
                    />
                    <BoringAvatar name={admin.email} size={32} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {admin.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{admin.email}</span>
                    </div>
                  </label>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-0 h-full overflow-y-auto">
              <InvitePolicyTab
                policy={policy}
                domains={domains}
                onPolicyChange={handlePolicyChange}
                onAddDomain={handleAddDomain}
                onRemoveDomain={handleRemoveDomain}
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="space-y-4">
          <Button
            onClick={handleLetsGo}
            size="lg"
            className="w-full rounded-full px-7 py-6"
            disabled={selectedEmails.size === 0 || isProcessing || needsDomains}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {updatePolicyMutation.isPending ? 'Saving settings...' : 'Sending invites...'}
              </>
            ) : (
              "Let's go"
            )}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isProcessing}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter out Intercom internal emails (e.g., support accounts)
function filterIntercomInternalEmails(admins: Admin[]): Admin[] {
  return admins.filter((admin) => !admin.email.endsWith('@intercom.io'));
}

export default function IntercomInvitePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const { data, isLoading, error, refetch } = useIntercomAdmins(true);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success) {
    return (
      <ErrorState
        workspaceId={workspaceId}
        message={data?.success === false ? data.error.message : 'Failed to load teammates'}
        onRetry={() => refetch()}
      />
    );
  }

  // Filter out @intercom.io emails (internal Intercom accounts)
  const filteredAdmins = filterIntercomInternalEmails(data.data.admins);

  if (filteredAdmins.length === 0) {
    return <EmptyState workspaceId={workspaceId} />;
  }

  return (
    <AdminSelectionState
      workspaceId={workspaceId}
      admins={filteredAdmins}
      invitePolicy={data.data.invitePolicy}
      allowedDomains={data.data.allowedDomains}
    />
  );
}
