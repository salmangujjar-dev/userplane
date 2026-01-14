'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { toast } from '@workspace/ui/components/sonner';
import type { DomainSortField, SortDirection } from '@/hooks/use-workspace-domains';
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
import { DomainList } from './domain-list';
import { DomainModalsManager } from './domain-modals-manager';
import { useDomainSectionState } from '@/hooks/use-domain-section-state';
import { useDomainStatusPolling } from '@/hooks/use-domain-status-polling';
import {
  type DomainSettings,
  DEFAULT_DOMAIN_SETTINGS,
  transformApiPreferencesToSettings,
} from '@/lib/types/domain';

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
  const queryClient = useQueryClient();

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const { sortBy, sortDirection } = SORT_OPTIONS[sortOption];

  // Fetch domains
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
  const domains = domainsData?.domains ?? [];
  const paginationMeta = domainsData?.pagination;
  const totalPages = paginationMeta?.totalPages ?? 1;

  // Domain section state (reducer-based)
  const { state, actions } = useDomainSectionState();

  // Polling hook for verification
  const { pollStatus, stopPolling } = useDomainStatusPolling();

  // Mutations
  const createDomainMutation = useCreateDomain(workspaceId);
  const updateDomainMutation = useUpdateDomain(workspaceId);
  const deleteDomainMutation = useDeleteDomain(workspaceId);
  const updateDomainPreferencesMutation = useUpdateDomainPreferences(
    workspaceId,
    (domainId, settings) => {
      // Update configuring domain if it matches
      if (state.configuringDomain?.domainId === domainId) {
        actions.updateConfigureSettings(settings);
      }
      // Update verifying domain settings if it matches
      if (state.verifyingDomain?.id === domainId) {
        actions.updateVerifyingSettings(settings);
      }
    }
  );

  // ========== Create Domain Handlers ==========
  const handleCreateDomain = useCallback(
    async (domainUrl: string): Promise<{ domainId: string; domainUrl: string } | null> => {
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
          onError: () => resolve(null),
        });
      });
    },
    [createDomainMutation]
  );

  const handleCreateModalStartVerification = useCallback(
    async (domainId: string): Promise<string | null> => {
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
    },
    [workspaceId]
  );

  const handleCreateModalPollVerification = useCallback(
    async (domainId: string): Promise<boolean> => {
      if (!workspaceId) return false;
      try {
        const [error, response] = await apiClient.workspace.domains.getById({
          params: { workspaceId, domainId },
        });
        if (error) return false;
        const isVerified = response.data.domain.domainStatus === 'verified';
        if (isVerified) {
          await queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
          toast.success('Domain verified successfully');
        }
        return isVerified;
      } catch {
        return false;
      }
    },
    [workspaceId, queryClient]
  );

  const handleCreateModalFetchSettings = useCallback(
    async (domainId: string): Promise<DomainSettings> => {
      if (!workspaceId) return DEFAULT_DOMAIN_SETTINGS;
      try {
        const [error, response] = await apiClient.workspace.domains.preferences.get({
          params: { workspaceId, domainId },
        });
        if (error) return DEFAULT_DOMAIN_SETTINGS;
        return transformApiPreferencesToSettings(response.data);
      } catch {
        return DEFAULT_DOMAIN_SETTINGS;
      }
    },
    [workspaceId]
  );

  const handleCreateModalSaveSettings = useCallback(
    (domainId: string, settings: DomainSettings) => {
      updateDomainPreferencesMutation.mutate({ domainId, settings });
    },
    [updateDomainPreferencesMutation]
  );

  // ========== Verification Flow Handlers ==========
  const handleStartVerification = useCallback(async () => {
    if (!workspaceId || !state.verifyingDomain) return;

    try {
      actions.setVerificationStep('verifying');

      const [error, response] = await apiClient.workspace.domains.getVerificationUrl({
        params: { workspaceId, domainId: state.verifyingDomain.id },
      });

      if (error) throw error;

      window.open(response.data.verificationUrl, '_blank', 'noopener,noreferrer');

      pollStatus(
        state.verifyingDomain.id,
        (result) => actions.setVerificationSuccess(result.settings),
        () => actions.setVerificationFailed()
      );
    } catch {
      actions.closeVerification();
      toast.error('Failed to start verification');
    }
  }, [workspaceId, state.verifyingDomain, actions, pollStatus]);

  const handleCloseVerification = useCallback(() => {
    stopPolling();
    actions.closeVerification();
  }, [stopPolling, actions]);

  const handleReverify = useCallback(() => {
    stopPolling();
    actions.reverify();
  }, [stopPolling, actions]);

  const handleSaveVerificationSettings = useCallback(
    (settings: DomainSettings) => {
      if (!state.verifyingDomain) return;
      updateDomainPreferencesMutation.mutate({
        domainId: state.verifyingDomain.id,
        settings,
      });
    },
    [state.verifyingDomain, updateDomainPreferencesMutation]
  );

  // ========== Edit Domain Handlers ==========
  const handleSaveEdit = useCallback(
    (newDomainUrl: string) => {
      if (!state.editingDomain) return;
      updateDomainMutation.mutate(
        { domainId: state.editingDomain.id, url: newDomainUrl },
        { onSuccess: () => actions.closeEditModal() }
      );
    },
    [state.editingDomain, updateDomainMutation, actions]
  );

  // ========== Configure Domain Handlers ==========
  const handleSaveConfigureSettings = useCallback(
    (settings: DomainSettings) => {
      if (!state.configuringDomain) return;
      updateDomainPreferencesMutation.mutate({
        domainId: state.configuringDomain.domainId,
        settings,
      });
    },
    [state.configuringDomain, updateDomainPreferencesMutation]
  );

  const handleVerifyFromConfigure = useCallback(() => {
    if (state.configuringDomain) {
      actions.startVerify({
        id: state.configuringDomain.domainId,
        url: state.configuringDomain.url,
      });
    }
  }, [state.configuringDomain, actions]);

  // ========== Delete Domain Handlers ==========
  const handleConfirmDelete = useCallback(() => {
    if (!state.deletingDomain) return;
    deleteDomainMutation.mutate(state.deletingDomain.id, {
      onSuccess: () => actions.onDeleteSuccess(),
    });
  }, [state.deletingDomain, deleteDomainMutation, actions]);

  // ========== Render ==========
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
      {/* Header with sort control */}
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

      {/* Domain List */}
      <div className="max-w-2xl">
        <DomainList
          domains={domains}
          onConfigure={actions.openConfigureModal}
          onEdit={(id, url) => actions.openEditModal({ id, url })}
          onDelete={(id, url) => actions.openDeleteModal({ id, url })}
          onAddDomain={actions.openCreateModal}
          loadingConfigureId={state.loadingConfigureId}
          isDeleteDisabled={deleteDomainMutation.isPending}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* All Modals */}
      <DomainModalsManager
        workspaceId={workspaceId || ''}
        // Verification flow
        verifyingDomain={state.verifyingDomain}
        verificationStep={state.verificationStep}
        verificationSuccess={state.verificationSuccess}
        verifyingDomainSettings={state.verifyingDomainSettings}
        onCloseVerification={handleCloseVerification}
        onStartVerification={handleStartVerification}
        onReverify={handleReverify}
        onSaveVerificationSettings={handleSaveVerificationSettings}
        verificationSettingsLoading={updateDomainPreferencesMutation.isPending}
        // Create modal
        showCreateModal={state.showCreateModal}
        onCloseCreateModal={(open) => !open && actions.closeCreateModal()}
        onCreateDomain={handleCreateDomain}
        onCreateModalStartVerification={handleCreateModalStartVerification}
        onCreateModalPollVerification={handleCreateModalPollVerification}
        onCreateModalFetchSettings={handleCreateModalFetchSettings}
        onCreateModalSaveSettings={handleCreateModalSaveSettings}
        createLoading={createDomainMutation.isPending}
        savingSettings={updateDomainPreferencesMutation.isPending}
        // Edit modal
        editingDomain={state.editingDomain}
        isEditModalOpen={state.isEditModalOpen}
        onCloseEditModal={(open) => !open && actions.closeEditModal()}
        onSaveEdit={handleSaveEdit}
        editLoading={updateDomainMutation.isPending}
        // Configure modal
        configuringDomain={state.configuringDomain}
        onCloseConfigureModal={(open) => !open && actions.closeConfigureModal()}
        onSaveConfigureSettings={handleSaveConfigureSettings}
        onVerifyFromConfigure={handleVerifyFromConfigure}
        configureLoading={updateDomainPreferencesMutation.isPending}
        // Delete modal
        deletingDomain={state.deletingDomain}
        onCloseDeleteModal={(open) => !open && actions.closeDeleteModal()}
        onConfirmDelete={handleConfirmDelete}
        deleteLoading={deleteDomainMutation.isPending}
      />
    </div>
  );
}
