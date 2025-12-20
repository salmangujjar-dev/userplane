'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ChevronRight, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { DomainVerificationPreModal } from '@/components/modals/domain-verification-pre-modal';
import { DomainVerificationVerifyingModal } from '@/components/modals/domain-verification-verifying-modal';
import { DomainVerificationPostModal } from '@/components/modals/domain-verification-post-modal';
import { EditDomainModal } from '@/components/modals/edit-domain-modal';
import { CreateDomainModal } from '@/components/modals/create-domain-modal';
import { DomainConfigureModal } from '@/components/modals/domain-configure-modal';
import { toast } from '@workspace/ui/components/sonner';
import { useWorkspaceDomains } from '@/hooks/use-workspace-domains';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleNetworkLogs: boolean;
  captureBackendServerLogs: boolean;
}

interface ConfiguringDomain {
  domainId: string;
  url: string;
  status: 'pending' | 'verified' | 'revoked';
  settings: DomainSettings | null;
}

type VerificationStep = 'pre' | 'verifying' | 'post' | null;

const ITEMS_PER_PAGE = 5;

export function DomainsSection() {
  const workspaceId = useWorkspaceId();
  const { data: domains, isLoading } = useWorkspaceDomains({
    perPage: 10,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<{ id: string; url: string } | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(true);
  const [editingDomain, setEditingDomain] = useState<{ id: string; url: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [configuringDomain, setConfiguringDomain] = useState<ConfiguringDomain | null>(null);
  const [loadingConfigureId, setLoadingConfigureId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createDomainMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.domains.add({
        params: { workspaceId },
        body: { url },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      toast.success('Domain added successfully');
      setShowCreateModal(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ domainId, url }: { domainId: string; url: string }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.domains.update({
        params: { workspaceId, domainId },
        body: { url },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      toast.success('Domain updated successfully');
      setIsEditModalOpen(false);
      setEditingDomain(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update domain: ${error.message}`);
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.domains.delete({
        params: { workspaceId, domainId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
      toast.success('Domain deleted successfully');
      setConfiguringDomain(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete domain: ${error.message}`);
    },
  });

  const updateDomainPreferencesMutation = useMutation({
    mutationFn: async ({ domainId, settings }: { domainId: string; settings: DomainSettings }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.domains.preferences.update({
        params: { workspaceId, domainId },
        body: {
          recordingHideSensitive: settings.hideSensitiveFields,
          recordingCaptureClientLog: settings.captureConsoleNetworkLogs,
          recordingCaptureServerLog: settings.captureBackendServerLogs,
          recordingCaptureNetworkLog: settings.captureConsoleNetworkLogs,
        },
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });

      // Refetch the updated preferences to update modal state
      if (configuringDomain && workspaceId) {
        try {
          const response = await apiClient.workspace.domains.preferences.get({
            params: { workspaceId, domainId: variables.domainId },
          });

          const preferences = response.data;
          const updatedSettings: DomainSettings = {
            hideSensitiveFields: preferences.recordingHideSensitive,
            captureConsoleNetworkLogs:
              preferences.recordingCaptureClientLog || preferences.recordingCaptureNetworkLog,
            captureBackendServerLogs: preferences.recordingCaptureServerLog,
          };

          // Update modal with fresh settings
          setConfiguringDomain({
            ...configuringDomain,
            settings: updatedSettings,
          });
        } catch {
          // If refetch fails, just close modal
          setConfiguringDomain(null);
        }
      }

      toast.success('Domain settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update domain settings: ${error.message}`);
    },
  });

  const handleCreateDomain = (domainUrl: string) => {
    createDomainMutation.mutate(domainUrl);
  };

  const handleVerify = (domainId: string, domainUrl: string) => {
    setVerifyingDomain({ id: domainId, url: domainUrl });
    setVerificationStep('pre');
  };

  const handleShowVerified = (domainId: string, domainUrl: string) => {
    setVerifyingDomain({ id: domainId, url: domainUrl });
    setVerificationStep('post');
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
      const response = await apiClient.workspace.domains.getById({
        params: { workspaceId, domainId },
      });

      const domain = response.data.domain;

      if (domain.domainStatus === 'verified') {
        // Success! Domain is verified
        stopPolling();
        queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
        setVerificationSuccess(true);
        setVerificationStep('post');
        toast.success('Domain verified successfully');
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
      const response = await apiClient.workspace.domains.getVerificationUrl({
        params: { workspaceId, domainId: verifyingDomain.id },
      });

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
    updateDomainMutation.mutate({ domainId: editingDomain.id, url: newDomainUrl });
  };

  const handleDeleteDomain = (domainId: string) => {
    deleteDomainMutation.mutate(domainId);
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
      const response = await apiClient.workspace.domains.preferences.get({
        params: { workspaceId, domainId },
      });

      const preferences = response.data;
      const settings: DomainSettings = {
        hideSensitiveFields: preferences.recordingHideSensitive,
        captureConsoleNetworkLogs:
          preferences.recordingCaptureClientLog || preferences.recordingCaptureNetworkLog,
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
          captureConsoleNetworkLogs: false,
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

  // Calculate these before any conditional returns to avoid hook order issues
  const displayedDomains = useMemo(() => domains || [], [domains]);
  const totalPages = Math.ceil(displayedDomains.length / ITEMS_PER_PAGE);

  const paginatedDomains = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return displayedDomains.slice(startIndex, endIndex);
  }, [displayedDomains, currentPage]);

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Domains</h2>
          <p className="text-sm text-muted-foreground">Configure domain and recording settings</p>
        </div>
        <div className="max-w-2xl space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Domains</h2>
        <p className="text-sm text-muted-foreground">Configure domain and recording settings</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {paginatedDomains.map((domain) => {
          const isVerified = domain.domainStatus === 'verified';

          return (
            <div
              key={domain.domainId}
              className="flex items-center justify-between p-4 rounded-xl border bg-card"
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
                      onClick={() => handleEditDomain(domain.domainId, domain.domainUrl)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Domain
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteDomain(domain.domainId)}
                      className="text-destructive focus:text-destructive"
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
        onReverify={handleReverify}
        verified={verificationSuccess}
      />

      <CreateDomainModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateDomain={handleCreateDomain}
        loading={createDomainMutation.isPending}
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
            captureConsoleNetworkLogs: false,
            captureBackendServerLogs: false,
          }
        }
        onSave={handleSaveSettings}
        onVerify={() => {
          if (configuringDomain) {
            handleVerify(configuringDomain.domainId, configuringDomain.url);
          }
        }}
        onShowVerified={() => {
          if (configuringDomain) {
            handleShowVerified(configuringDomain.domainId, configuringDomain.url);
          }
        }}
        loading={updateDomainPreferencesMutation.isPending}
      />
    </div>
  );
}
