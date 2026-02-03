'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Input } from '@workspace/ui/components/input';
import Logo from '@workspace/ui/components/logo';
import { toast } from '@workspace/ui/components/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { cn } from '@workspace/ui/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { useAccount } from '@/features/account';
import { useCreateDomain, useUpdateDomain } from '@/features/domains';
import { useSendWorkspaceInvites, useUpdateInvitePolicy } from '@/features/workspace';
import { showErrorToast } from '@/lib/errors';
import { FormEmailSchema } from '@/schemas';
import type { WorkspaceInvitePolicy } from '@/types';

import { IntercomInviteHeader } from './intercom-invite-header';
import { InvitePolicyTab } from './invite-policy-tab';
import type { Teammate } from './types';
import { WorkspaceDomainsSection } from './workspace-domains-section';

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

interface InviteTeammatesViewProps {
  workspaceId: string;
  teammates: Teammate[];
  invitePolicy: WorkspaceInvitePolicy;
  allowedDomains: string[] | null;
  initialDomainId: string | null;
  initialDomainUrl: string;
  variant?: 'direct' | 'intercom';
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
  onComplete,
  onSkip,
}: InviteTeammatesViewProps) {
  const [activeTab, setActiveTab] = useState('teammates');

  // Fetch current user to show in the team list
  const { data: accountResult } = useAccount();
  const currentUser = accountResult?.success ? accountResult.data : null;

  // Selection state - tracks all selected emails (both manual and from teammates)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() => {
    const initialSelection = teammates.slice(0, AUTO_SELECT_LIMIT).map((t) => t.email);
    return new Set(initialSelection);
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Manual emails state - just stores the email strings (validated on add)
  const [manualEmails, setManualEmails] = useState<string[]>([]);

  // Policy state (email domains for invite policy)
  const [policy, setPolicy] = useState<WorkspaceInvitePolicy>(initialPolicy);
  const [emailDomains, setEmailDomains] = useState<string[]>(initialDomains || []);

  // Workspace domain state (URL for recordings) - initialized from props
  const [domainUrl, setDomainUrl] = useState(initialDomainUrl);
  const [existingDomainId] = useState<string | null>(initialDomainId);
  const [originalDomainUrl] = useState(initialDomainUrl);

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

  // Sync policy state with initial values
  useEffect(() => {
    setPolicy(initialPolicy);
    setEmailDomains(initialDomains || []);
  }, [initialPolicy, initialDomains]);

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
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allTeammates.slice(start, start + ITEMS_PER_PAGE);
  }, [allTeammates, currentPage]);

  // Check if policy has changes
  const hasPolicyChanges = useMemo(() => {
    const policyChanged = policy !== initialPolicy;
    const domainsChanged =
      JSON.stringify(emailDomains.sort()) !== JSON.stringify((initialDomains || []).sort());
    return policyChanged || domainsChanged;
  }, [policy, emailDomains, initialPolicy, initialDomains]);

  // Check if workspace domain has changes
  const hasDomainChanges = useMemo(() => {
    return domainUrl.trim() !== '' && domainUrl !== originalDomainUrl;
  }, [domainUrl, originalDomainUrl]);

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
    setCurrentPage(1);
  };

  const handlePolicyChange = (newPolicy: WorkspaceInvitePolicy) => {
    setPolicy(newPolicy);
  };

  const handleAddEmailDomain = (domain: string) => {
    if (domain && !emailDomains.includes(domain)) {
      setEmailDomains([...emailDomains, domain]);
    }
  };

  const handleRemoveEmailDomain = (domainToRemove: string) => {
    setEmailDomains(emailDomains.filter((d) => d !== domainToRemove));
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
          { domainId: existingDomainId, url: domainUrl },
          {
            onSuccess: (result) => {
              if (!result.success) {
                showErrorToast(result.error);
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
        createDomainMutation.mutate(domainUrl, {
          onSuccess: (result) => {
            if (!result.success) {
              showErrorToast(result.error);
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
          policy,
          domains: emailDomains.length > 0 ? emailDomains : null,
        },
        {
          onSuccess: (result) => {
            if (!result.success) {
              showErrorToast(result.error);
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
            showErrorToast(result.error);
            return;
          }
          toast.success(
            `Invites sent to ${allEmailsToInvite.length} teammate${allEmailsToInvite.length > 1 ? 's' : ''}`
          );
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
          {variant === 'direct' ? <Logo /> : <IntercomInviteHeader />}

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Invite your teammates</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select team members to invite to your workspace
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="teammates">Teammates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Fixed height container to prevent layout shifts between tabs */}
          <div className="h-[380px] mt-4">
            <TabsContent value="teammates" className="mt-0 h-full flex flex-col">
              {/* Header with select all */}
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-sm text-muted-foreground">
                  {selectedEmails.size} selected
                </span>
                {selectableTeammates.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>

              {/* Unified teammates list */}
              <div className="divide-y flex-1 overflow-y-auto">
                {paginatedTeammates.map((teammate) => (
                  <label
                    key={teammate.id}
                    className={cn(
                      'flex items-center gap-3 p-3 transition-colors',
                      teammate.isCurrentUser ? 'opacity-60' : 'cursor-pointer hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={teammate.isCurrentUser || selectedEmails.has(teammate.email)}
                      onCheckedChange={() =>
                        !teammate.isCurrentUser && handleToggleTeammate(teammate)
                      }
                      disabled={teammate.isCurrentUser}
                    />
                    <BoringAvatar name={teammate.email} size={28} />
                    <div className="flex flex-col min-w-0 flex-1">
                      {teammate.name ? (
                        <>
                          <span className="text-sm font-medium truncate">
                            {teammate.name}
                            {teammate.isCurrentUser && ' (You)'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {teammate.email}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-medium truncate">
                          {teammate.email}
                          {teammate.isCurrentUser && ' (You)'}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-3">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {/* Email input form at bottom */}
              <form onSubmit={handleSubmit(onAddEmail)} className="mt-3 pt-3 border-t">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="Add email address..."
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" variant="secondary" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 h-full overflow-y-auto">
              <div className="space-y-6">
                <WorkspaceDomainsSection value={domainUrl} onChange={setDomainUrl} />

                <InvitePolicyTab
                  policy={policy}
                  domains={emailDomains}
                  onPolicyChange={handlePolicyChange}
                  onAddDomain={handleAddEmailDomain}
                  onRemoveDomain={handleRemoveEmailDomain}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="space-y-4">
          <Button
            onClick={handleLetsGo}
            size="lg"
            className="w-full rounded-full px-7 py-6"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {createDomainMutation.isPending || updateDomainMutation.isPending
                  ? 'Saving domain...'
                  : updatePolicyMutation.isPending
                    ? 'Saving settings...'
                    : 'Sending invites...'}
              </>
            ) : (
              "Let's go"
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
      </div>
    </div>
  );
}
