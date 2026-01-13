'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@workspace/ui/components/pagination';
import {
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
  Settings,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import type { DomainSortField, SortDirection } from '@/hooks/use-workspace-domains';
import { DomainVerificationPreModal } from '@/components/modals/domain-verification-pre-modal';
import { DomainVerificationVerifyingModal } from '@/components/modals/domain-verification-verifying-modal';
import { DomainVerificationPostModal } from '@/components/modals/domain-verification-post-modal';
import { EditDomainModal } from '@/components/modals/edit-domain-modal';
import { CreateDomainModal } from '@/components/modals/create-domain-modal';
import { DomainConfigureModal } from '@/components/modals/domain-configure-modal';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { toast } from '@workspace/ui/components/sonner';
import { useWorkspaceDomains } from '@/hooks/use-workspace-domains';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import {
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain,
  useUpdateDomainPreferences,
} from '@/queries/use-domain-mutations';
import { SectionError } from '@/components/shared/section-error';
import { DomainsSectionSkeleton } from '@/components/skeleton';

interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleLogs: boolean;
  captureClientActions: boolean;
  captureNetworkLogs: boolean;
  captureBackendServerLogs: boolean;
}

const DEFAULT_SETTINGS: DomainSettings = {
  hideSensitiveFields: false,
  captureConsoleLogs: false,
  captureClientActions: false,
  captureNetworkLogs: false,
  captureBackendServerLogs: false,
};

interface ConfiguringDomain {
  domainId: string;
  url: string;
  status: 'pending' | 'verified' | 'revoked';
  settings: DomainSettings | null;
}

type VerificationStep = 'pre' | 'verifying' | 'post' | null;

const ITEMS_PER_PAGE = 5;

type SortOption = 'recent' | 'oldest' | 'az' | 'za';

const SORT_OPTIONS: Record<SortOption, { sortBy: DomainSortField; sortDirection: SortDirection }> =
  {
    recent: { sortBy: 'created_at', sortDirection: 'desc' },
    oldest: { sortBy: 'created_at', sortDirection: 'asc' },
    az: { sortBy: 'domain_url', sortDirection: 'asc' },
    za: { sortBy: 'domain_url', sortDirection: 'desc' },
  };

export function DomainsSection() {
  const workspaceId = useWorkspaceId();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const { sortBy, sortDirection } = SORT_OPTIONS[sortOption];

  const {
    data: domainsResult,
    isLoading,
    error,
    refetch,
  } = useWorkspaceDomains({
    perPage: ITEMS_PER_PAGE,
    page: currentPage,
    sortBy,
    sortDirection,
  });
  const domainsData = domainsResult?.success ? domainsResult.data : null;
  const domains = domainsData?.domains ?? null;
  const paginationMeta = domainsData?.pagination;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<{ id: string; url: string } | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(true);
  const [verifyingDomainSettings, setVerifyingDomainSettings] = useState<DomainSettings>({
    hideSensitiveFields: false,
    captureConsoleLogs: false,
    captureClientActions: false,
    captureNetworkLogs: false,
    captureBackendServerLogs: false,
  });
  const [editingDomain, setEditingDomain] = useState<{ id: string; url: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [configuringDomain, setConfiguringDomain] = useState<ConfiguringDomain | null>(null);
  const [loadingConfigureId, setLoadingConfigureId] = useState<string | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<{ id: string; url: string } | null>(null);
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createDomainMutation = useCreateDomain(workspaceId);
  const updateDomainMutation = useUpdateDomain(workspaceId);
  const deleteDomainMutation = useDeleteDomain(workspaceId);
  const updateDomainPreferencesMutation = useUpdateDomainPreferences(
    workspaceId,
    (domainId, settings) => {
      // Update configuring domain if it matches
      if (configuringDomain && configuringDomain.domainId === domainId) {
        setConfiguringDomain({
          ...configuringDomain,
          settings,
        });
      }
      // Update verifying domain settings if it matches
      if (verifyingDomain && verifyingDomain.id === domainId) {
        setVerifyingDomainSettings(settings);
      }
    }
  );

  const handleCreateDomain = async (
    domainUrl: string
  ): Promise<{ domainId: string; domainUrl: string } | null> => {
    return new Promise((resolve) => {
      createDomainMutation.mutate(domainUrl, {
        onSuccess: (result) => {
          if (result.success && result.data?.domain) {
            resolve({
              domainId: result.data.domain.domainId,
              domainUrl: result.data.domain.domainUrl,
            });
          } else {
            resolve(null);
          }
        },
        onError: () => {
          resolve(null);
        },
      });
    });
  };

  const handleCreateModalStartVerification = async (domainId: string): Promise<string | null> => {
    if (!workspaceId) return null;

    try {
      const [error, response] = await apiClient.workspace.domains.getVerificationUrl({
        params: { workspaceId, domainId },
      });

      if (error) return null;
      return response.data.verificationUrl;
    } catch {
      return null;
    }
  };

  const handleCreateModalPollVerification = async (domainId: string): Promise<boolean> => {
    if (!workspaceId) return false;

    try {
      const [error, response] = await apiClient.workspace.domains.getById({
        params: { workspaceId, domainId },
      });

      if (error) return false;

      const isVerified = response.data.domain.domainStatus === 'verified';
      if (isVerified) {
        // Invalidate and wait for refetch to ensure UI is updated
        await queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
        toast.success('Domain verified successfully');
      }
      return isVerified;
    } catch {
      return false;
    }
  };

  const handleCreateModalFetchSettings = async (domainId: string): Promise<DomainSettings> => {
    if (!workspaceId) return DEFAULT_SETTINGS;

    try {
      const [error, response] = await apiClient.workspace.domains.preferences.get({
        params: { workspaceId, domainId },
      });

      if (error) return DEFAULT_SETTINGS;

      return {
        hideSensitiveFields: response.data.recordingHideSensitive,
        captureConsoleLogs: response.data.recordingCaptureClientLog,
        captureClientActions: response.data.recordingCaptureClientAction,
        captureNetworkLogs: response.data.recordingCaptureNetworkLog,
        captureBackendServerLogs: response.data.recordingCaptureServerLog,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  };

  const handleCreateModalSaveSettings = (domainId: string, settings: DomainSettings) => {
    updateDomainPreferencesMutation.mutate({ domainId, settings });
  };

  const handleVerify = (domainId: string, domainUrl: string) => {
    setVerifyingDomain({ id: domainId, url: domainUrl });
    setVerificationStep('pre');
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollDomainStatus = async (domainId: string, attempt: number = 0): Promise<void> => {
    if (!workspaceId) return;

    try {
      const [error, response] = await apiClient.workspace.domains.getById({
        params: { workspaceId, domainId },
      });

      if (error) throw error;

      const domain = response.data.domain;

      if (domain.domainStatus === 'verified') {
        // Success! Domain is verified
        stopPolling();
        queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
        setVerificationSuccess(true);
        toast.success('Domain verified successfully');

        // Fetch domain settings for the post modal
        try {
          const [prefError, prefResponse] = await apiClient.workspace.domains.preferences.get({
            params: { workspaceId, domainId },
          });

          if (!prefError && prefResponse) {
            const preferences = prefResponse.data;
            setVerifyingDomainSettings({
              hideSensitiveFields: preferences.recordingHideSensitive,
              captureConsoleLogs: preferences.recordingCaptureClientLog,
              captureClientActions: preferences.recordingCaptureClientAction,
              captureNetworkLogs: preferences.recordingCaptureNetworkLog,
              captureBackendServerLogs: preferences.recordingCaptureServerLog,
            });
          }
        } catch {
          // Use default settings on error
        }

        setVerificationStep('post');
      } else if (attempt < 10) {
        // Continue polling with exponential backoff
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000); // Max 10 seconds
        pollingIntervalRef.current = setTimeout(() => {
          pollDomainStatus(domainId, attempt + 1);
        }, delay);
      } else {
        // Timeout after 10 attempts - keep modal open with reverify option
        stopPolling();
        setVerificationSuccess(false);
        setVerificationStep('post');
      }
    } catch {
      // On error, stop polling and show timeout modal
      stopPolling();
      setVerificationSuccess(false);
      setVerificationStep('post');
    }
  };

  const handleStartVerification = async () => {
    if (!workspaceId || !verifyingDomain) return;

    try {
      setVerificationSuccess(true);
      setVerificationStep('verifying');

      // Get verification URL from backend
      const [error, response] = await apiClient.workspace.domains.getVerificationUrl({
        params: { workspaceId, domainId: verifyingDomain.id },
      });

      if (error) {
        console.log('error: ', error);
        throw error;
      }

      const verificationUrl = response.data.verificationUrl;

      // Open verification URL in new tab
      window.open(verificationUrl, '_blank', 'noopener,noreferrer');

      // Start polling for verification status
      pollDomainStatus(verifyingDomain.id);
    } catch {
      setVerificationStep(null);
      toast.error('Failed to start verification');
    }
  };

  const handleCloseModals = () => {
    stopPolling();
    setVerifyingDomain(null);
    setVerificationStep(null);
  };

  const handleReverify = () => {
    stopPolling();
    setVerificationStep('pre');
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleEditDomain = (domainId: string, domainUrl: string) => {
    setEditingDomain({ id: domainId, url: domainUrl });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (newDomainUrl: string) => {
    if (!editingDomain) return;
    updateDomainMutation.mutate(
      { domainId: editingDomain.id, url: newDomainUrl },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditingDomain(null);
        },
      }
    );
  };

  const handleDeleteDomain = (domainId: string, domainUrl: string) => {
    setDeletingDomain({ id: domainId, url: domainUrl });
  };

  const handleConfirmDelete = () => {
    if (deletingDomain) {
      deleteDomainMutation.mutate(deletingDomain.id, {
        onSuccess: () => {
          setConfiguringDomain(null);
          setDeletingDomain(null);
        },
      });
    }
  };

  const handleConfigure = async (
    domainId: string,
    domainUrl: string,
    status: 'pending' | 'verified' | 'revoked'
  ) => {
    if (!workspaceId) return;

    setLoadingConfigureId(domainId);

    try {
      // Fetch current preferences
      const [error, response] = await apiClient.workspace.domains.preferences.get({
        params: { workspaceId, domainId },
      });

      if (error) {
        console.log('error: ', error);
        throw error;
      }

      const preferences = response.data;
      const settings: DomainSettings = {
        hideSensitiveFields: preferences.recordingHideSensitive,
        captureConsoleLogs: preferences.recordingCaptureClientLog,
        captureClientActions: preferences.recordingCaptureClientAction,
        captureNetworkLogs: preferences.recordingCaptureNetworkLog,
        captureBackendServerLogs: preferences.recordingCaptureServerLog,
      };

      setConfiguringDomain({
        domainId,
        url: domainUrl,
        status,
        settings,
      });
    } catch {
      toast.error('Failed to load domain settings');
      // Fallback to default settings
      setConfiguringDomain({
        domainId,
        url: domainUrl,
        status,
        settings: {
          hideSensitiveFields: false,
          captureConsoleLogs: false,
          captureClientActions: false,
          captureNetworkLogs: false,
          captureBackendServerLogs: false,
        },
      });
    } finally {
      setLoadingConfigureId(null);
    }
  };

  const handleSaveSettings = (settings: DomainSettings) => {
    if (!configuringDomain) return;
    updateDomainPreferencesMutation.mutate({
      domainId: configuringDomain.domainId,
      settings,
    });
  };

  const handleSaveVerificationSettings = (settings: DomainSettings) => {
    if (!verifyingDomain) return;
    updateDomainPreferencesMutation.mutate({
      domainId: verifyingDomain.id,
      settings,
    });
  };

  // Calculate these before any conditional returns to avoid hook order issues
  const displayedDomains = useMemo(() => domains || [], [domains]);
  const totalPages = paginationMeta?.totalPages ?? 1;

  if (isLoading) {
    return <DomainsSectionSkeleton />;
  }

  if (error || (domainsResult && !domainsResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Domains</h2>
          <p className="text-sm text-muted-foreground">Configure domain and recording settings</p>
        </div>
        <div className="max-w-2xl">
          <SectionError
            title="Failed to load domains"
            description={
              error instanceof Error
                ? error.message
                : domainsResult && !domainsResult.success
                  ? domainsResult.error.message
                  : 'Something went wrong while loading domains.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold">Domains</h2>
          <p className="text-sm text-muted-foreground">Configure domain and recording settings</p>
        </div>
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
          <SelectTrigger className="w-[160px] h-9">
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Added</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="az">A to Z</SelectItem>
            <SelectItem value="za">Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="max-w-2xl space-y-4">
        {displayedDomains.map((domain) => {
          const isVerified = domain.domainStatus === 'verified';

          return (
            <div
              key={domain.domainId}
              className="flex items-center justify-between p-6 rounded-xl border bg-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <span className="text-sm">
                  {domain.domainUrl.includes('/') ? (
                    <>
                      <span className="text-foreground">{domain.domainUrl.split('/')[0]}/</span>
                      <span className="text-muted-foreground">
                        {domain.domainUrl.split('/').slice(1).join('/')}
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground">{domain.domainUrl}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                  onClick={() =>
                    handleConfigure(domain.domainId, domain.domainUrl, domain.domainStatus)
                  }
                  disabled={loadingConfigureId === domain.domainId}
                >
                  Configure
                  {loadingConfigureId === domain.domainId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        handleConfigure(domain.domainId, domain.domainUrl, domain.domainStatus)
                      }
                      disabled={loadingConfigureId === domain.domainId}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Domain
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEditDomain(domain.domainId, domain.domainUrl)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Domain
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteDomain(domain.domainId, domain.domainUrl)}
                      disabled={deleteDomainMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Domain
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          className="w-full max-w-2xl"
          onClick={() => setShowCreateModal(true)}
        >
          Set up another domain
        </Button>

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <DomainVerificationPreModal
        open={verificationStep === 'pre'}
        onOpenChange={handleCloseModals}
        domainUrl={verifyingDomain?.url || ''}
        workspaceId={workspaceId || ''}
        onVerify={handleStartVerification}
      />

      <DomainVerificationVerifyingModal
        open={verificationStep === 'verifying'}
        onOpenChange={handleCloseModals}
      />

      <DomainVerificationPostModal
        open={verificationStep === 'post'}
        onOpenChange={handleCloseModals}
        domainUrl={verifyingDomain?.url || ''}
        workspaceId={workspaceId || ''}
        onReverify={handleReverify}
        verified={verificationSuccess}
        settings={verifyingDomainSettings}
        onSaveSettings={handleSaveVerificationSettings}
        loadingSettings={updateDomainPreferencesMutation.isPending}
      />

      <CreateDomainModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateDomain={handleCreateDomain}
        onStartVerification={handleCreateModalStartVerification}
        onPollVerification={handleCreateModalPollVerification}
        onFetchSettings={handleCreateModalFetchSettings}
        onSaveSettings={handleCreateModalSaveSettings}
        workspaceId={workspaceId || ''}
        loading={createDomainMutation.isPending}
        savingSettings={updateDomainPreferencesMutation.isPending}
      />

      <EditDomainModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        domainUrl={editingDomain?.url || ''}
        onSave={handleSaveEdit}
        loading={updateDomainMutation.isPending}
      />

      <DomainConfigureModal
        open={!!configuringDomain}
        onOpenChange={(open) => !open && setConfiguringDomain(null)}
        domainUrl={configuringDomain?.url || ''}
        verified={configuringDomain?.status === 'verified'}
        settings={
          configuringDomain?.settings || {
            hideSensitiveFields: false,
            captureConsoleLogs: false,
            captureClientActions: false,
            captureNetworkLogs: false,
            captureBackendServerLogs: false,
          }
        }
        onSave={handleSaveSettings}
        onVerify={() => {
          if (configuringDomain) {
            handleVerify(configuringDomain.domainId, configuringDomain.url);
          }
        }}
        loading={updateDomainPreferencesMutation.isPending}
      />

      <DeleteConfirmationModal
        open={!!deletingDomain}
        onOpenChange={(open) => !open && setDeletingDomain(null)}
        itemName={deletingDomain?.url || ''}
        itemType="domain"
        onConfirm={handleConfirmDelete}
        isLoading={deleteDomainMutation.isPending}
      />
    </div>
  );
}
