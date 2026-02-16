'use client';

import { useCallback, useReducer } from 'react';

import { apiClient } from '@/client';
import { showDomainSettingsLoadFailedToast } from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';
import {
  type ConfiguringDomain,
  DEFAULT_DOMAIN_RECORDING_PREFERENCES,
  type DomainIdentifier,
  type DomainRecordingPreferences,
  type DomainStatus,
} from '@/types/domain';

import type { VerificationStep } from './use-verification-flow';

// Combined state for all domain section interactions
interface DomainSectionState {
  // Create modal
  showCreateModal: boolean;

  // Verification flow
  verifyingDomain: DomainIdentifier | null;
  verificationStep: VerificationStep;
  verificationSuccess: boolean;
  verifyingDomainSettings: DomainRecordingPreferences;

  // Edit modal
  editingDomain: DomainIdentifier | null;
  isEditModalOpen: boolean;

  // Configure modal
  configuringDomain: ConfiguringDomain | null;
  loadingConfigureId: string | null;

  // Instructions flow
  instructionsDomain: DomainIdentifier | null;
  showInstructionsModal: boolean;

  // Delete modal
  deletingDomain: DomainIdentifier | null;
}

// Action types
type DomainSectionAction =
  // Create modal actions
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'CLOSE_CREATE_MODAL' }

  // Verification flow actions
  | { type: 'START_VERIFY'; payload: DomainIdentifier }
  | { type: 'SET_VERIFICATION_STEP'; payload: VerificationStep }
  | { type: 'VERIFICATION_SUCCESS'; payload: DomainRecordingPreferences }
  | { type: 'VERIFICATION_FAILED' }
  | { type: 'UPDATE_VERIFYING_SETTINGS'; payload: DomainRecordingPreferences }
  | { type: 'CLOSE_VERIFICATION' }
  | { type: 'REVERIFY' }

  // Edit modal actions
  | { type: 'OPEN_EDIT_MODAL'; payload: DomainIdentifier }
  | { type: 'CLOSE_EDIT_MODAL' }

  // Configure modal actions
  | { type: 'START_CONFIGURE'; payload: string }
  | { type: 'SET_CONFIGURING_DOMAIN'; payload: ConfiguringDomain }
  | { type: 'UPDATE_CONFIGURE_SETTINGS'; payload: DomainRecordingPreferences }
  | { type: 'CLOSE_CONFIGURE_MODAL' }
  | { type: 'CONFIGURE_LOADING_DONE' }

  // Instructions flow actions
  | { type: 'OPEN_INSTRUCTIONS'; payload: DomainIdentifier }
  | { type: 'CLOSE_INSTRUCTIONS' }

  // Delete modal actions
  | { type: 'OPEN_DELETE_MODAL'; payload: DomainIdentifier }
  | { type: 'CLOSE_DELETE_MODAL' }
  | { type: 'DELETE_SUCCESS' };

const initialState: DomainSectionState = {
  showCreateModal: false,
  verifyingDomain: null,
  verificationStep: null,
  verificationSuccess: true,
  verifyingDomainSettings: { ...DEFAULT_DOMAIN_RECORDING_PREFERENCES },
  editingDomain: null,
  isEditModalOpen: false,
  configuringDomain: null,
  loadingConfigureId: null,
  instructionsDomain: null,
  showInstructionsModal: false,
  deletingDomain: null,
};

function domainSectionReducer(
  state: DomainSectionState,
  action: DomainSectionAction
): DomainSectionState {
  switch (action.type) {
    // Create modal
    case 'OPEN_CREATE_MODAL':
      return { ...state, showCreateModal: true };
    case 'CLOSE_CREATE_MODAL':
      return { ...state, showCreateModal: false };

    // Verification flow
    case 'START_VERIFY':
      return {
        ...state,
        verifyingDomain: action.payload,
        verificationStep: 'pre',
        verificationSuccess: true,
      };
    case 'SET_VERIFICATION_STEP':
      return { ...state, verificationStep: action.payload };
    case 'VERIFICATION_SUCCESS':
      return {
        ...state,
        verificationStep: 'post',
        verificationSuccess: true,
        verifyingDomainSettings: action.payload,
      };
    case 'VERIFICATION_FAILED':
      return {
        ...state,
        verificationStep: 'post',
        verificationSuccess: false,
      };
    case 'UPDATE_VERIFYING_SETTINGS':
      return { ...state, verifyingDomainSettings: action.payload };
    case 'CLOSE_VERIFICATION':
      return {
        ...state,
        verifyingDomain: null,
        verificationStep: null,
        verificationSuccess: true,
        verifyingDomainSettings: { ...DEFAULT_DOMAIN_RECORDING_PREFERENCES },
      };
    case 'REVERIFY':
      return { ...state, verificationStep: 'pre' };

    // Edit modal
    case 'OPEN_EDIT_MODAL':
      return { ...state, editingDomain: action.payload, isEditModalOpen: true };
    case 'CLOSE_EDIT_MODAL':
      return { ...state, editingDomain: null, isEditModalOpen: false };

    // Configure modal
    case 'START_CONFIGURE':
      return { ...state, loadingConfigureId: action.payload };
    case 'SET_CONFIGURING_DOMAIN':
      return { ...state, configuringDomain: action.payload, loadingConfigureId: null };
    case 'UPDATE_CONFIGURE_SETTINGS':
      return state.configuringDomain
        ? { ...state, configuringDomain: { ...state.configuringDomain, settings: action.payload } }
        : state;
    case 'CLOSE_CONFIGURE_MODAL':
      return { ...state, configuringDomain: null };
    case 'CONFIGURE_LOADING_DONE':
      return { ...state, loadingConfigureId: null };

    // Instructions flow
    case 'OPEN_INSTRUCTIONS':
      return { ...state, instructionsDomain: action.payload, showInstructionsModal: true };
    case 'CLOSE_INSTRUCTIONS':
      return { ...state, instructionsDomain: null, showInstructionsModal: false };

    // Delete modal
    case 'OPEN_DELETE_MODAL':
      return { ...state, deletingDomain: action.payload };
    case 'CLOSE_DELETE_MODAL':
      return { ...state, deletingDomain: null };
    case 'DELETE_SUCCESS':
      return { ...state, deletingDomain: null, configuringDomain: null };

    default:
      return state;
  }
}

export function useDomainSectionState() {
  const workspaceId = useWorkspaceId();
  const [state, dispatch] = useReducer(domainSectionReducer, initialState);

  // Create modal handlers
  const openCreateModal = useCallback(() => dispatch({ type: 'OPEN_CREATE_MODAL' }), []);
  const closeCreateModal = useCallback(() => dispatch({ type: 'CLOSE_CREATE_MODAL' }), []);

  // Verification flow handlers
  const startVerify = useCallback(
    (domain: DomainIdentifier) => dispatch({ type: 'START_VERIFY', payload: domain }),
    []
  );
  const setVerificationStep = useCallback(
    (step: VerificationStep) => dispatch({ type: 'SET_VERIFICATION_STEP', payload: step }),
    []
  );
  const setVerificationSuccess = useCallback(
    (settings: DomainRecordingPreferences) =>
      dispatch({ type: 'VERIFICATION_SUCCESS', payload: settings }),
    []
  );
  const setVerificationFailed = useCallback(() => dispatch({ type: 'VERIFICATION_FAILED' }), []);
  const updateVerifyingSettings = useCallback(
    (settings: DomainRecordingPreferences) =>
      dispatch({ type: 'UPDATE_VERIFYING_SETTINGS', payload: settings }),
    []
  );
  const closeVerification = useCallback(() => dispatch({ type: 'CLOSE_VERIFICATION' }), []);
  const reverify = useCallback(() => dispatch({ type: 'REVERIFY' }), []);

  // Edit modal handlers
  const openEditModal = useCallback(
    (domain: DomainIdentifier) => dispatch({ type: 'OPEN_EDIT_MODAL', payload: domain }),
    []
  );
  const closeEditModal = useCallback(() => dispatch({ type: 'CLOSE_EDIT_MODAL' }), []);

  // Configure modal handlers
  const openConfigureModal = useCallback(
    async (domainId: string, domainUrl: string, status: DomainStatus) => {
      if (!workspaceId) return;

      dispatch({ type: 'START_CONFIGURE', payload: domainId });

      try {
        const [error, response] = await apiClient.workspace.domains.preferences.get({
          params: { workspaceId, domainId },
        });

        if (error) throw error;

        dispatch({
          type: 'SET_CONFIGURING_DOMAIN',
          payload: { domainId, url: domainUrl, status, settings: response.data },
        });
      } catch {
        showDomainSettingsLoadFailedToast();
        // Fall back to default settings
        dispatch({
          type: 'SET_CONFIGURING_DOMAIN',
          payload: {
            domainId,
            url: domainUrl,
            status,
            settings: { ...DEFAULT_DOMAIN_RECORDING_PREFERENCES },
          },
        });
      }
    },
    [workspaceId]
  );
  const updateConfigureSettings = useCallback(
    (settings: DomainRecordingPreferences) =>
      dispatch({ type: 'UPDATE_CONFIGURE_SETTINGS', payload: settings }),
    []
  );
  const closeConfigureModal = useCallback(() => dispatch({ type: 'CLOSE_CONFIGURE_MODAL' }), []);

  // Instructions flow handlers
  const openInstructions = useCallback(
    (domain: DomainIdentifier) => dispatch({ type: 'OPEN_INSTRUCTIONS', payload: domain }),
    []
  );
  const closeInstructions = useCallback(() => dispatch({ type: 'CLOSE_INSTRUCTIONS' }), []);

  // Delete modal handlers
  const openDeleteModal = useCallback(
    (domain: DomainIdentifier) => dispatch({ type: 'OPEN_DELETE_MODAL', payload: domain }),
    []
  );
  const closeDeleteModal = useCallback(() => dispatch({ type: 'CLOSE_DELETE_MODAL' }), []);
  const onDeleteSuccess = useCallback(() => dispatch({ type: 'DELETE_SUCCESS' }), []);

  return {
    state,
    actions: {
      openCreateModal,
      closeCreateModal,
      startVerify,
      setVerificationStep,
      setVerificationSuccess,
      setVerificationFailed,
      updateVerifyingSettings,
      closeVerification,
      reverify,
      openEditModal,
      closeEditModal,
      openConfigureModal,
      updateConfigureSettings,
      closeConfigureModal,
      openInstructions,
      closeInstructions,
      openDeleteModal,
      closeDeleteModal,
      onDeleteSuccess,
    },
  };
}
