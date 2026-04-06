'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@userplane/ui/components/button';
import { Checkbox } from '@userplane/ui/components/checkbox';
import { Input } from '@userplane/ui/components/input';
import Logo from '@userplane/ui/components/logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { cn } from '@userplane/ui/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthIcons } from '@/components/auth/auth-icons';
import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { useAccount } from '@/features/account';
import { useCreateDomain, useUpdateDomain } from '@/features/domains';
import { useSendWorkspaceInvites, useUpdateInvitePolicy } from '@/features/workspace';
import { showApiErrorToast } from '@/lib/errors';
import { showTeammatesInvitedToast } from '@/lib/toasts';
import { FormEmailSchema } from '@/schemas';
import type { WorkspaceInvitePolicy } from '@/types';

import { IntercomInviteHeader } from './intercom-invite-header';
import { InvitePolicyTab } from './invite-policy-tab';
import { SlackInviteHeader } from './slack-invite-header';
import type { Teammate } from './types';
import { WorkspaceDomainsSection } from './workspace-domains-section';
import { ZendeskInviteHeader } from './zendesk-invite-header';

const ITEMS_PER_PAGE = 6;
const AUTO_SELECT_LIMIT = 5;
const MAX_MANUAL_EMAILS = 10;

// Schema for email input validation
const emailSchema = z.object({
  email: FormEmailSchema,
});

type EmailFormData = z.infer<typeof emailSchema>;

// Internal teammate type for rendering (extends base Teammate with flags)
interface TeammateItem {
  id: string;
  email: string;
  name: string | null;
  isManual: boolean;
  isCurrentUser: boolean;
}

interface TeammatesSelectionHeaderProps {
  selectedCount: number;
  hasSelectableTeammates: boolean;
  allSelected: boolean;
  onSelectAll: () => void;
}

function TeammatesSelectionHeader({
  selectedCount,
  hasSelectableTeammates,
  allSelected,
  onSelectAll,
}: TeammatesSelectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
      {hasSelectableTeammates && (
        <button
          type="button"
          onClick={onSelectAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      )}
    </div>
  );
}

interface TeammateListItemProps {
  teammate: TeammateItem;
  isSelected: boolean;
  onToggle: (teammate: TeammateItem) => void;
}

function TeammateListItem({ teammate, isSelected, onToggle }: TeammateListItemProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 p-3 transition-colors',
        teammate.isCurrentUser ? 'opacity-60' : 'cursor-pointer hover:bg-muted/50'
      )}
    >
      <Checkbox
        checked={teammate.isCurrentUser || isSelected}
        onCheckedChange={() => !teammate.isCurrentUser && onToggle(teammate)}
        disabled={teammate.isCurrentUser}
      />
      <BoringAvatar name={teammate.name} email={teammate.email} size={AVATAR_SIZES.GROUP} />
      <div className="flex flex-col min-w-0 flex-1">
        {teammate.name ? (
          <>
            <span className="text-sm font-medium truncate">
              {teammate.name}
              {teammate.isCurrentUser && ' (You)'}
            </span>
            <span className="text-xs text-muted-foreground truncate">{teammate.email}</span>
          </>
        ) : (
          <span className="text-sm font-medium truncate">
            {teammate.email}
            {teammate.isCurrentUser && ' (You)'}
          </span>
        )}
      </div>
    </label>
  );
}

interface AddEmailFormProps {
  register: ReturnType<typeof useForm<EmailFormData>>['register'];
  onSubmit: ReturnType<typeof useForm<EmailFormData>>['handleSubmit'];
  onAddEmail: (data: EmailFormData) => void;
  error?: string;
}

function AddEmailForm({ register: registerField, onSubmit, onAddEmail, error }: AddEmailFormProps) {
  return (
    <form onSubmit={onSubmit(onAddEmail)} className="mt-3 pt-3 border-t">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            {...registerField('email')}
            type="email"
            placeholder="Add email address..."
            className={error ? 'border-destructive' : ''}
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <Button type="submit" variant="secondary" size="icon" className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

interface InviteActionsFooterProps {
  isProcessing: boolean;
  completionLabel: string;
  processingLabel: string;
  onAction: () => void;
  onSkip: () => void;
}

function InviteActionsFooter({
  isProcessing,
  completionLabel,
  processingLabel,
  onAction,
  onSkip,
}: InviteActionsFooterProps) {
  return (
    <div className="space-y-4">
      <Button onClick={onAction} size="lg" className="w-full px-7 py-6" disabled={isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {processingLabel}
          </>
        ) : (
          completionLabel
        )}
      </Button>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={isProcessing}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

interface InviteTeammatesViewProps {
  workspaceId: string;
  teammates: Teammate[];
  invitePolicy: WorkspaceInvitePolicy;
  allowedDomains: string[] | null;
  initialDomainId: string | null;
  initialDomainUrl: string;
  variant?: 'direct' | 'intercom' | 'slack' | 'zendesk';
  completionLabel?: string;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Main view for selecting teammates to invite and configuring invite policy.
 * Features a tabbed interface with Teammates selection and Settings tabs.
 * Used in both the OAuth callback flow and the settings invite page.
 */
export function InviteTeammatesView({
  workspaceId,
  teammates,
  invitePolicy: initialPolicy,
  allowedDomains: initialDomains,
  initialDomainId,
  initialDomainUrl,
  variant = 'intercom',
  completionLabel = 'Go to workspace',
  onComplete,
  onSkip,
}: InviteTeammatesViewProps) {
  const [viewState, setViewState] = useState({ activeTab: 'teammates', currentPage: 1 });

  // Fetch current user to show in the team list
  const { data: accountResult } = useAccount();
  const currentUser = accountResult?.success ? accountResult.data : null;

  // Selection state - tracks all selected emails (both manual and from teammates)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() => {
    const initialSelection = teammates.slice(0, AUTO_SELECT_LIMIT).map((t) => t.email);
    return new Set(initialSelection);
  });

  // Manual emails state - just stores the email strings (validated on add)
  const [manualEmails, setManualEmails] = useState<string[]>([]);

  // Policy + domain config state
  const [configState, setConfigState] = useState({
    policy: initialPolicy as WorkspaceInvitePolicy,
    emailDomains: (initialDomains || []) as string[],
    domainUrl: initialDomainUrl,
  });
  const existingDomainId = initialDomainId;
  const originalDomainUrl = initialDomainUrl;

  // Email input form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  // Mutations
  const sendInvites = useSendWorkspaceInvites(workspaceId);
  const updatePolicyMutation = useUpdateInvitePolicy();
  const createDomainMutation = useCreateDomain(workspaceId);
  const updateDomainMutation = useUpdateDomain(workspaceId);

  // Sync state with initial values during render
  const prevInitialPolicyRef = useRef(initialPolicy);
  const prevInitialDomainsRef = useRef(initialDomains);
  const prevInitialDomainUrlRef = useRef(initialDomainUrl);
  if (
    prevInitialPolicyRef.current !== initialPolicy ||
    prevInitialDomainsRef.current !== initialDomains
  ) {
    prevInitialPolicyRef.current = initialPolicy;
    prevInitialDomainsRef.current = initialDomains;
    setConfigState((prev) => ({
      ...prev,
      policy: initialPolicy,
      emailDomains: initialDomains || [],
    }));
  }
  if (prevInitialDomainUrlRef.current !== initialDomainUrl) {
    prevInitialDomainUrlRef.current = initialDomainUrl;
    setConfigState((prev) => ({ ...prev, domainUrl: initialDomainUrl }));
  }

  // Create unified teammates list (current user first, then manual emails, then teammates from props)
  const allTeammates: TeammateItem[] = useMemo(() => {
    const items: TeammateItem[] = [];

    // Current user always first (if available)
    if (currentUser) {
      items.push({
        id: 'current-user',
        email: currentUser.userEmail,
        name: currentUser.userName,
        isManual: false,
        isCurrentUser: true,
      });
    }

    // Manual emails (skip if same as current user)
    manualEmails.forEach((email) => {
      if (currentUser && email.toLowerCase() === currentUser.userEmail.toLowerCase()) return;
      items.push({
        id: `manual-${email}`,
        email,
        name: null,
        isManual: true,
        isCurrentUser: false,
      });
    });

    // Teammates from props (skip if same as current user)
    teammates.forEach((t) => {
      if (currentUser && t.email.toLowerCase() === currentUser.userEmail.toLowerCase()) return;
      items.push({
        id: t.id,
        email: t.email,
        name: t.name,
        isManual: false,
        isCurrentUser: false,
      });
    });

    return items;
  }, [manualEmails, teammates, currentUser]);

  // Pagination over unified list
  const totalPages = Math.ceil(allTeammates.length / ITEMS_PER_PAGE);
  const paginatedTeammates = useMemo(() => {
    const start = (viewState.currentPage - 1) * ITEMS_PER_PAGE;
    return allTeammates.slice(start, start + ITEMS_PER_PAGE);
  }, [allTeammates, viewState.currentPage]);

  // Check if policy has changes
  const hasPolicyChanges = useMemo(() => {
    const policyChanged = configState.policy !== initialPolicy;
    const domainsChanged =
      JSON.stringify(configState.emailDomains.sort()) !==
      JSON.stringify((initialDomains || []).sort());
    return policyChanged || domainsChanged;
  }, [configState.policy, configState.emailDomains, initialPolicy, initialDomains]);

  // Check if workspace domain has changes
  const hasDomainChanges = useMemo(() => {
    return configState.domainUrl.trim() !== '' && configState.domainUrl !== originalDomainUrl;
  }, [configState.domainUrl, originalDomainUrl]);

  const isProcessing =
    sendInvites.isPending ||
    updatePolicyMutation.isPending ||
    createDomainMutation.isPending ||
    updateDomainMutation.isPending;

  // Check if all selectable teammates (excluding current user) are selected
  const selectableTeammates = allTeammates.filter((t) => !t.isCurrentUser);
  const allSelected =
    selectableTeammates.length > 0 && selectableTeammates.every((t) => selectedEmails.has(t.email));

  // Toggle email selection
  const handleToggleEmail = (email: string) => {
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

  // Also remove from manual emails if unchecking a manual one
  const handleToggleTeammate = (teammate: TeammateItem) => {
    handleToggleEmail(teammate.email);
    // If unchecking a manual email, remove it from the list
    if (teammate.isManual && selectedEmails.has(teammate.email)) {
      setManualEmails((prev) => prev.filter((e) => e !== teammate.email));
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEmails(new Set());
    } else {
      // Only select non-current-user teammates
      setSelectedEmails(new Set(selectableTeammates.map((t) => t.email)));
    }
  };

  // Add email from form
  const onAddEmail = (data: EmailFormData) => {
    const email = data.email.trim().toLowerCase();

    // Check if already exists
    const existsInManual = manualEmails.some((e) => e.toLowerCase() === email);
    const existsInTeammates = teammates.some((t) => t.email.toLowerCase() === email);

    if (existsInManual || existsInTeammates) {
      // Just select it if it already exists
      setSelectedEmails((prev) => new Set([...prev, email]));
      reset();
      return;
    }

    if (manualEmails.length >= MAX_MANUAL_EMAILS) {
      setError('email', { message: `Maximum ${MAX_MANUAL_EMAILS} emails can be added` });
      return;
    }

    // Add to manual emails and auto-select
    setManualEmails((prev) => [...prev, email]);
    setSelectedEmails((prev) => new Set([...prev, email]));
    reset();
    // Reset to page 1 to show the newly added email
    setViewState((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePolicyChange = (newPolicy: WorkspaceInvitePolicy) => {
    setConfigState((prev) => ({ ...prev, policy: newPolicy }));
  };

  const handleAddEmailDomain = (domain: string) => {
    if (domain && !configState.emailDomains.includes(domain)) {
      setConfigState((prev) => ({ ...prev, emailDomains: [...prev.emailDomains, domain] }));
    }
  };

  const handleRemoveEmailDomain = (domainToRemove: string) => {
    setConfigState((prev) => ({
      ...prev,
      emailDomains: prev.emailDomains.filter((d) => d !== domainToRemove),
    }));
  };

  // Save workspace domain (create or update)
  const saveDomain = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!hasDomainChanges) {
        resolve(true);
        return;
      }

      if (existingDomainId) {
        // Update existing domain
        updateDomainMutation.mutate(
          { domainId: existingDomainId, url: configState.domainUrl },
          {
            onSuccess: (result) => {
              if (!result.success) {
                showApiErrorToast(result.error);
                resolve(false);
                return;
              }
              resolve(true);
            },
            onError: () => resolve(false),
          }
        );
      } else {
        // Create new domain
        createDomainMutation.mutate(configState.domainUrl, {
          onSuccess: (result) => {
            if (!result.success) {
              showApiErrorToast(result.error);
              resolve(false);
              return;
            }
            resolve(true);
          },
          onError: () => resolve(false),
        });
      }
    });
  };

  // Save invite policy
  const savePolicy = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!hasPolicyChanges) {
        resolve(true);
        return;
      }

      updatePolicyMutation.mutate(
        {
          workspaceId,
          policy: configState.policy,
          domains: configState.emailDomains.length > 0 ? configState.emailDomains : null,
        },
        {
          onSuccess: (result) => {
            if (!result.success) {
              showApiErrorToast(result.error);
              resolve(false);
              return;
            }
            resolve(true);
          },
          onError: () => resolve(false),
        }
      );
    });
  };

  // All emails to invite (from selection, excluding current user)
  const allEmailsToInvite = useMemo(() => {
    const currentUserEmail = currentUser?.userEmail?.toLowerCase();
    return Array.from(selectedEmails).filter((email) => email.toLowerCase() !== currentUserEmail);
  }, [selectedEmails, currentUser]);

  // Main action: save domain, policy, then send invites
  const handleLetsGo = async () => {
    // Save domain first (if changed)
    if (hasDomainChanges) {
      const domainSaved = await saveDomain();
      if (!domainSaved) return;
    }

    // Save policy (if changed)
    if (hasPolicyChanges) {
      const policySaved = await savePolicy();
      if (!policySaved) return;
    }

    // Send invites only if there are emails selected
    if (allEmailsToInvite.length > 0) {
      sendInvites.mutate(allEmailsToInvite, {
        onSuccess: (result) => {
          if (!result.success) {
            showApiErrorToast(result.error);
            return;
          }
          showTeammatesInvitedToast(allEmailsToInvite.length);
          onComplete();
        },
      });
    } else {
      // No invites to send, just complete
      onComplete();
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center gap-6">
          {variant === 'direct' ? (
            <Logo />
          ) : variant === 'slack' ? (
            <SlackInviteHeader />
          ) : variant === 'zendesk' ? (
            <ZendeskInviteHeader />
          ) : (
            <IntercomInviteHeader />
          )}

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Almost there</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select team members to invite to your workspace
            </p>
          </div>
        </div>

        <Tabs
          value={viewState.activeTab}
          onValueChange={(v) => setViewState((prev) => ({ ...prev, activeTab: v }))}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="teammates">Teammates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Fixed height container to prevent layout shifts between tabs */}
          <div className="h-[380px] mt-4">
            <TabsContent value="teammates" className="mt-0 h-full flex flex-col">
              <TeammatesSelectionHeader
                selectedCount={selectedEmails.size}
                hasSelectableTeammates={selectableTeammates.length > 0}
                allSelected={allSelected}
                onSelectAll={handleSelectAll}
              />

              {/* Unified teammates list */}
              <div className="divide-y flex-1 overflow-y-auto">
                {paginatedTeammates.map((teammate) => (
                  <TeammateListItem
                    key={teammate.id}
                    teammate={teammate}
                    isSelected={selectedEmails.has(teammate.email)}
                    onToggle={handleToggleTeammate}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-3">
                  <PaginationControls
                    currentPage={viewState.currentPage}
                    totalPages={totalPages}
                    onPageChange={(p) => setViewState((prev) => ({ ...prev, currentPage: p }))}
                  />
                </div>
              )}

              <AddEmailForm
                register={register}
                onSubmit={handleSubmit}
                onAddEmail={onAddEmail}
                error={errors.email?.message}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-0 h-full overflow-y-auto">
              <div className="space-y-6">
                <WorkspaceDomainsSection
                  value={configState.domainUrl}
                  onChange={(v) => setConfigState((prev) => ({ ...prev, domainUrl: v }))}
                />

                <InvitePolicyTab
                  policy={configState.policy}
                  domains={configState.emailDomains}
                  onPolicyChange={handlePolicyChange}
                  onAddDomain={handleAddEmailDomain}
                  onRemoveDomain={handleRemoveEmailDomain}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <InviteActionsFooter
          isProcessing={isProcessing}
          completionLabel={completionLabel}
          processingLabel={
            createDomainMutation.isPending || updateDomainMutation.isPending
              ? 'Saving domain...'
              : updatePolicyMutation.isPending
                ? 'Saving settings...'
                : 'Sending invites...'
          }
          onAction={handleLetsGo}
          onSkip={onSkip}
        />
      </div>
    </div>
  );
}
