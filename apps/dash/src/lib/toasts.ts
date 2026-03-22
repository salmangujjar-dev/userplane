import { toast } from '@userplane/ui/components/sonner';

// ============================================
// CLIPBOARD
// ============================================

export function showCopiedToClipboardToast(label = 'Link') {
  toast.success(`${label} copied to clipboard`, { id: 'clipboard-copy' });
}

export function showCopyFailedToast() {
  toast.error('Failed to copy link');
}

// ============================================
// CRUD SUCCESS
// ============================================

export function showCreatedToast(entity: string, description?: string) {
  toast.success(`${entity} created successfully`, { description });
}

export function showUpdatedToast(entity: string, description = 'Changes saved') {
  toast.success(`${entity} updated successfully`, { description });
}

export function showDeletedToast(entity: string, description?: string) {
  toast.success(`${entity} deleted successfully`, { description });
}

// ============================================
// SETTINGS SAVED (with dedup id)
// ============================================

export function showSettingsSavedToast(id: string, label: string, description = 'Changes saved') {
  toast.success(label, { id, description });
}

// ============================================
// ERROR WITH DESCRIPTION
// ============================================

export function showErrorToast(message: string, error?: { message: string }) {
  toast.error(message, error ? { description: error.message } : undefined);
}

// ============================================
// VALIDATION (email invites)
// ============================================

export function showMaxEmailsErrorToast(max: number) {
  toast.error(`You can only invite up to ${max} people at once`);
}

export function showMaxSendErrorToast(max: number) {
  toast.error(`You can only send to up to ${max} people at once`);
}

export function showDuplicateEmailErrorToast() {
  toast.error('This email has already been added');
}

export function showNoEmailsErrorToast() {
  toast.error('Please add at least one valid email address');
}

// ============================================
// PROMISE-BASED
// ============================================

export function showPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string }
) {
  return toast.promise(promise, messages);
}

// ============================================
// AUTH & ACCOUNT
// ============================================

export function showAuthenticationFailedToast() {
  toast.error('Failed to authenticate. Please try again.');
}

export function showMagicLinkSentToast() {
  toast.success('Check your email for the magic link');
}

export function showMagicLinkFailedToast(errorMessage?: string) {
  toast.error(errorMessage || 'Failed to send magic link. Please try again.');
}

export function showAccountDeletionEmailSentToast() {
  toast.success('Check your email for the confirmation link');
}

export function showAccountDeletionEmailFailedToast(errorMessage?: string) {
  toast.error('Failed to send deletion email', {
    description: errorMessage || 'Please try again later.',
  });
}

export function showAccountDeletedToast() {
  toast.success('Account deleted successfully', {
    description: 'Your account and data have been removed',
  });
}

export function showAccountDeletionFailedToast(errorMessage?: string) {
  toast.error('Deletion failed', {
    description: errorMessage || 'Failed to delete account. Please try again.',
  });
}

// ============================================
// WORKSPACE & INVITES
// ============================================

export function showInviteAcceptFailedToast(errorMessage?: string) {
  toast.error('Failed to accept invite', {
    description: errorMessage || 'Please try again.',
  });
}

export function showInviteValidationErrorToast(message: string) {
  toast.error(message);
}

export function showWorkspaceJoinedToast(workspaceName: string) {
  toast.success('Joined workspace successfully', {
    description: `You are now a member of ${workspaceName}`,
  });
}

export function showAccessRequestSentToast() {
  toast.success('Access request sent', {
    description: 'The workspace owner will be notified of your request.',
  });
}

export function showAccessRequestApprovedToast() {
  toast.success('Access request approved');
}

export function showAccessRequestDeclinedToast() {
  toast.success('Access request declined');
}

export function showAccessRequestApproveFailedToast(errorMessage?: string) {
  toast.error('Failed to approve access request', {
    description: errorMessage || 'Please try again.',
  });
}

export function showAccessRequestDeclineFailedToast(errorMessage?: string) {
  toast.error('Failed to decline access request', {
    description: errorMessage || 'Please try again.',
  });
}

export function showWorkspaceSuggestionsLoadFailedToast(errorMessage?: string) {
  toast.error('Failed to load workspace suggestions', {
    description: errorMessage || 'Please try again.',
  });
}

export function showIntercomConnectionFailedToast(errorMessage?: string) {
  toast.error('Failed to connect to Intercom', {
    description: errorMessage || 'Please try again.',
  });
}

export function showIntercomDisconnectedToast() {
  toast.success('Intercom disconnected successfully');
}

export function showZendeskDisconnectedToast() {
  toast.success('Zendesk disconnected successfully');
}

export function showTeammatesInvitedToast(count: number) {
  toast.success(`Invites sent to ${count} teammate${count > 1 ? 's' : ''}`);
}

export function showShareRecordingToast(count: number) {
  toast.success(`Recording shared with ${count} ${count === 1 ? 'person' : 'people'}`);
}

export function showWorkspaceLeftToast(workspaceDeleted: boolean = false) {
  if (workspaceDeleted) {
    toast.success('Left and deactivated workspace');
  } else {
    toast.success('Left workspace successfully');
  }
}

export function showWorkspaceRestoredToast(restoredProjects: number, restoredLinks: number) {
  toast.success('Workspace restored successfully', {
    description: `Restored ${restoredProjects} project(s) and ${restoredLinks} link(s)`,
  });
}

export function showDomainVerifiedToast() {
  toast.success('Domain verified successfully');
}

export function showVerificationStartFailedToast() {
  toast.error('Failed to start verification');
}

export function showDomainSettingsLoadFailedToast() {
  toast.error('Failed to load domain settings');
}

export function showRecordingCannotBePlayedToast() {
  toast.error('This recording cannot be played');
}

export function showInvitesSentToast(count: number) {
  toast.success(`Invites sent to ${count} email${count > 1 ? 's' : ''}`);
}

export function showInvitesAcceptedToast(workspaceName: string) {
  toast.success(`Successfully joined ${workspaceName}`);
}

export function showImpersonatingToast(userName?: string) {
  toast.success(`Now impersonating ${userName || 'user'}`);
}

export function showFeatureAccessRequestedToast() {
  toast.success('Access requested', {
    description: "We'll notify you when this feature is available",
  });
}
