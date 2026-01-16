'use client';

import { DomainVerificationPreModal } from '@/components/modals/domain-verification-pre-modal';
import { DomainVerificationVerifyingModal } from '@/components/modals/domain-verification-verifying-modal';
import { DomainVerificationPostModal } from '@/components/modals/domain-verification-post-modal';
import { EditDomainModal } from '@/components/modals/edit-domain-modal';
import { CreateDomainModal } from '@/components/modals/create-domain-modal';
import { DomainConfigureModal } from '@/components/modals/domain-configure-modal';
import { DeveloperInstructionsModal } from '@/components/modals/developer-instructions-modal';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { useSendDomainInstructions } from '@/hooks/use-domain-instructions';
import type { VerificationStep } from '@/hooks/use-verification-flow';
import {
  type DomainSettings,
  type DomainIdentifier,
  type ConfiguringDomain,
  DEFAULT_DOMAIN_SETTINGS,
} from '@/lib/types/domain';

interface DomainModalsManagerProps {
  workspaceId: string;

  // Verification flow
  verifyingDomain: DomainIdentifier | null;
  verificationStep: VerificationStep;
  verificationSuccess: boolean;
  verifyingDomainSettings: DomainSettings;
  onCloseVerification: () => void;
  onStartVerification: () => Promise<void>;
  onReverify: () => void;
  onSaveVerificationSettings: (settings: DomainSettings) => void;
  verificationSettingsLoading: boolean;

  // Create modal
  showCreateModal: boolean;
  onCloseCreateModal: (open: boolean) => void;
  onCreateDomain: (url: string) => Promise<{ domainId: string; domainUrl: string } | null>;
  onCreateModalStartVerification: (domainId: string) => Promise<string | null>;
  onCreateModalPollVerification: (domainId: string) => Promise<boolean>;
  onCreateModalFetchSettings: (domainId: string) => Promise<DomainSettings>;
  onCreateModalSaveSettings: (domainId: string, settings: DomainSettings) => void;
  createLoading: boolean;
  savingSettings: boolean;

  // Edit modal
  editingDomain: DomainIdentifier | null;
  isEditModalOpen: boolean;
  onCloseEditModal: (open: boolean) => void;
  onSaveEdit: (newUrl: string) => void;
  editLoading: boolean;

  // Configure modal
  configuringDomain: ConfiguringDomain | null;
  onCloseConfigureModal: (open: boolean) => void;
  onSaveConfigureSettings: (settings: DomainSettings) => void;
  onVerifyFromConfigure: () => void;
  onSendInstructionsFromConfigure: () => void;
  configureLoading: boolean;

  // Instructions flow
  instructionsDomain: DomainIdentifier | null;
  showInstructionsModal: boolean;
  onCloseInstructions: (open: boolean) => void;

  // Delete modal
  deletingDomain: DomainIdentifier | null;
  onCloseDeleteModal: (open: boolean) => void;
  onConfirmDelete: () => void;
  deleteLoading: boolean;
}

/**
 * Manages all domain-related modals
 * Centralizes modal rendering to keep the main component clean
 */
export function DomainModalsManager({
  workspaceId,

  // Verification flow
  verifyingDomain,
  verificationStep,
  verificationSuccess,
  verifyingDomainSettings,
  onCloseVerification,
  onStartVerification,
  onReverify,
  onSaveVerificationSettings,
  verificationSettingsLoading,

  // Create modal
  showCreateModal,
  onCloseCreateModal,
  onCreateDomain,
  onCreateModalStartVerification,
  onCreateModalPollVerification,
  onCreateModalFetchSettings,
  onCreateModalSaveSettings,
  createLoading,
  savingSettings,

  // Edit modal
  editingDomain,
  isEditModalOpen,
  onCloseEditModal,
  onSaveEdit,
  editLoading,

  // Configure modal
  configuringDomain,
  onCloseConfigureModal,
  onSaveConfigureSettings,
  onVerifyFromConfigure,
  onSendInstructionsFromConfigure,
  configureLoading,

  // Instructions flow
  instructionsDomain,
  showInstructionsModal,
  onCloseInstructions,

  // Delete modal
  deletingDomain,
  onCloseDeleteModal,
  onConfirmDelete,
  deleteLoading,
}: DomainModalsManagerProps) {
  const { mutate: sendInstructions, isPending: isSendingInstructions } =
    useSendDomainInstructions();

  const handleSendInstructions = (emails: string[]) => {
    if (!instructionsDomain) return;
    sendInstructions(
      { domainId: instructionsDomain.id, emails },
      {
        onSuccess: () => {
          onCloseInstructions(false);
        },
      }
    );
  };

  return (
    <>
      {/* Verification Flow Modals */}
      <DomainVerificationPreModal
        open={verificationStep === 'pre'}
        onOpenChange={onCloseVerification}
        domainUrl={verifyingDomain?.url || ''}
        workspaceId={workspaceId}
        onVerify={onStartVerification}
      />

      <DomainVerificationVerifyingModal
        open={verificationStep === 'verifying'}
        onOpenChange={onCloseVerification}
      />

      <DomainVerificationPostModal
        open={verificationStep === 'post'}
        onOpenChange={onCloseVerification}
        domainUrl={verifyingDomain?.url || ''}
        workspaceId={workspaceId}
        onReverify={onReverify}
        verified={verificationSuccess}
        settings={verifyingDomainSettings}
        onSaveSettings={onSaveVerificationSettings}
        loadingSettings={verificationSettingsLoading}
      />

      {/* Create Domain Modal */}
      <CreateDomainModal
        open={showCreateModal}
        onOpenChange={onCloseCreateModal}
        onCreateDomain={onCreateDomain}
        onStartVerification={onCreateModalStartVerification}
        onPollVerification={onCreateModalPollVerification}
        onFetchSettings={onCreateModalFetchSettings}
        onSaveSettings={onCreateModalSaveSettings}
        workspaceId={workspaceId}
        loading={createLoading}
        savingSettings={savingSettings}
      />

      {/* Edit Domain Modal */}
      <EditDomainModal
        open={isEditModalOpen}
        onOpenChange={onCloseEditModal}
        domainUrl={editingDomain?.url || ''}
        onSave={onSaveEdit}
        loading={editLoading}
      />

      {/* Configure Domain Modal */}
      <DomainConfigureModal
        open={!!configuringDomain}
        onOpenChange={onCloseConfigureModal}
        domainUrl={configuringDomain?.url || ''}
        domainId={configuringDomain?.domainId || ''}
        verified={configuringDomain?.status === 'verified'}
        settings={configuringDomain?.settings || DEFAULT_DOMAIN_SETTINGS}
        onSave={onSaveConfigureSettings}
        onVerify={onVerifyFromConfigure}
        onSendInstructions={onSendInstructionsFromConfigure}
        loading={configureLoading}
      />

      {/* Developer Instructions Modal */}
      <DeveloperInstructionsModal
        open={showInstructionsModal}
        onOpenChange={onCloseInstructions}
        domainUrl={instructionsDomain?.url || ''}
        onSend={handleSendInstructions}
        loading={isSendingInstructions}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={!!deletingDomain}
        onOpenChange={onCloseDeleteModal}
        itemName={deletingDomain?.url || ''}
        itemType="domain"
        onConfirm={onConfirmDelete}
        isLoading={deleteLoading}
      />
    </>
  );
}
