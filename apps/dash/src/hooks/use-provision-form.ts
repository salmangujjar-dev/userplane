import { useState, useCallback } from 'react';
import type { PlanId } from '@workspace/pricing';
import type { AdminProvisionRole } from '@workspace/contract';
import { PLAN_OPTIONS } from '@workspace/contract';

/**
 * Form member interface using contract types
 */
export interface ProvisionFormMember {
  email: string;
  name: string;
  role: AdminProvisionRole;
}

/**
 * Provision form data structure matching contract expectations
 */
export interface ProvisionFormData {
  owner: { email: string; name: string };
  workspace: { name: string; url: string; plan: PlanId };
  members: ProvisionFormMember[];
}

/**
 * Re-export PLAN_OPTIONS from contract for backward compatibility
 */
export { PLAN_OPTIONS };

/**
 * Hook for managing workspace provisioning form state
 * Uses contract types for type safety with backend API
 */
export function useProvisionForm() {
  // Owner fields
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Workspace fields
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [workspacePlan, setWorkspacePlan] = useState<PlanId>('early_bird_monthly');

  // Members
  const [members, setMembers] = useState<ProvisionFormMember[]>([]);

  const resetForm = useCallback(() => {
    setOwnerEmail('');
    setOwnerName('');
    setWorkspaceName('');
    setWorkspaceUrl('');
    setWorkspacePlan('early_bird_monthly');
    setMembers([]);
  }, []);

  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, { email: '', name: '', role: 'member' }]);
  }, []);

  const removeMember = useCallback((index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateMember = useCallback(
    (index: number, field: keyof ProvisionFormMember, value: string) => {
      setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
    },
    []
  );

  const isValid =
    ownerEmail.trim() !== '' &&
    ownerName.trim() !== '' &&
    workspaceName.trim() !== '' &&
    workspaceUrl.trim() !== '' &&
    // Validate members have email and name filled
    members.every((m) => m.email.trim() !== '' && m.name.trim() !== '');

  const getFormData = (): ProvisionFormData => ({
    owner: {
      email: ownerEmail.trim(),
      name: ownerName.trim(),
    },
    workspace: {
      name: workspaceName.trim(),
      url: workspaceUrl.trim(),
      plan: workspacePlan,
    },
    members: members.map((m) => ({
      email: m.email.trim(),
      name: m.name.trim(),
      role: m.role,
    })),
  });

  return {
    ownerEmail,
    setOwnerEmail,
    ownerName,
    setOwnerName,
    workspaceName,
    setWorkspaceName,
    workspaceUrl,
    setWorkspaceUrl,
    workspacePlan,
    setWorkspacePlan,
    members,
    addMember,
    removeMember,
    updateMember,
    isValid,
    resetForm,
    getFormData,
  };
}
