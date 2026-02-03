'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Input } from '@workspace/ui/components/input';
import { toast } from '@workspace/ui/components/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import validator from 'validator';
import { z } from 'zod';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { useCreateDomain, useUpdateDomain } from '@/features/domains';
import { useSendWorkspaceInvites, useUpdateInvitePolicy } from '@/features/workspace';
import { showErrorToast } from '@/lib/errors';
import type { WorkspaceInvitePolicy } from '@/types';

import { IntercomInviteHeader } from './intercom-invite-header';
import { InvitePolicyTab } from './invite-policy-tab';
import type { Admin } from './types';
import { WorkspaceDomainsSection } from './workspace-domains-section';

const ITEMS_PER_PAGE = 6;
const AUTO_SELECT_LIMIT = 5;
const MAX_MANUAL_EMAILS = 10;

// Schema for email input validation
const emailSchema = z.object({
  email: z.string().refine((val) => validator.isEmail(val), {
    message: 'Please enter a valid email address',
  }),
});

type EmailFormData = z.infer<typeof emailSchema>;

// Unified teammate type for rendering
interface Teammate {
  id: string;
  email: string;
  name: string | null;
  isManual: boolean;
}

interface AdminSelectionViewProps {
  workspaceId: string;
  admins: Admin[];
  invitePolicy: WorkspaceInvitePolicy;
  allowedDomains: string[] | null;
  initialDomainId: string | null;
  initialDomainUrl: string;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Main view for selecting teammates to invite and configuring invite policy.
 * Features a tabbed interface with Teammates selection and Settings tabs.
 * Used in both the OAuth callback flow and the settings invite page.
 */
export function AdminSelectionView({
  workspaceId,
  admins,
  invitePolicy: initialPolicy,
  allowedDomains: initialDomains,
  initialDomainId,
  initialDomainUrl,
  onComplete,
  onSkip,
}: AdminSelectionViewProps) {
  const [activeTab, setActiveTab] = useState('teammates');

  // Selection state - tracks all selected emails (both manual and admin)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() => {
    const initialSelection = admins.slice(0, AUTO_SELECT_LIMIT).map((a) => a.email);
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

  // Create unified teammates list (manual emails first, then admins)
  const allTeammates: Teammate[] = useMemo(() => {
    const manualItems: Teammate[] = manualEmails.map((email) => ({
      id: `manual-${email}`,
      email,
      name: null,
      isManual: true,
    }));
    const adminItems: Teammate[] = admins.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      isManual: false,
    }));
    return [...manualItems, ...adminItems];
  }, [manualEmails, admins]);

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

  // Validation
  const needsEmailDomains = policy !== 'private' && emailDomains.length === 0;
  const isProcessing =
    sendInvites.isPending ||
    updatePolicyMutation.isPending ||
    createDomainMutation.isPending ||
    updateDomainMutation.isPending;

  const allSelected =
    allTeammates.length > 0 && allTeammates.every((t) => selectedEmails.has(t.email));

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
  const handleToggleTeammate = (teammate: Teammate) => {
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
      setSelectedEmails(new Set(allTeammates.map((t) => t.email)));
    }
  };

  // Add email from form
  const onAddEmail = (data: EmailFormData) => {
    const email = data.email.trim().toLowerCase();

    // Check if already exists
    const existsInManual = manualEmails.some((e) => e.toLowerCase() === email);
    const existsInAdmins = admins.some((a) => a.email.toLowerCase() === email);

    if (existsInManual || existsInAdmins) {
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
    if (newPolicy === 'private') {
      setEmailDomains([]);
    }
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
          domains: policy === 'private' ? null : emailDomains.length > 0 ? emailDomains : null,
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

  // All emails to invite (from selection)
  const allEmailsToInvite = useMemo(() => {
    return Array.from(selectedEmails);
  }, [selectedEmails]);

  // Main action: save domain, policy, then send invites
  const handleLetsGo = async () => {
    if (allEmailsToInvite.length === 0) return;

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

    // Send invites
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
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <IntercomInviteHeader />

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
                {allTeammates.length > 0 && (
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
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedEmails.has(teammate.email)}
                      onCheckedChange={() => handleToggleTeammate(teammate)}
                    />
                    <BoringAvatar name={teammate.email} size={28} />
                    <div className="flex flex-col min-w-0 flex-1">
                      {teammate.name ? (
                        <>
                          <span className="text-sm font-medium truncate">{teammate.name}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {teammate.email}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-medium truncate">{teammate.email}</span>
                      )}
                    </div>
                  </label>
                ))}
                {allTeammates.length === 0 && (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Add emails below to invite teammates
                  </div>
                )}
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
            disabled={allEmailsToInvite.length === 0 || isProcessing || needsEmailDomains}
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
