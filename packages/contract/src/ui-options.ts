/**
 * UI Options
 *
 * Pre-configured option arrays for use in frontend dropdowns, filters, and form controls.
 * All options are derived from the schema constants to ensure type safety and consistency.
 *
 * Usage:
 * ```typescript
 * import { SORT_DIRECTION_OPTIONS, WORKSPACE_ROLE_OPTIONS } from '@workspace/contract/ui-options';
 *
 * <Select>
 *   {SORT_DIRECTION_OPTIONS.map(opt => (
 *     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
 *   ))}
 * </Select>
 * ```
 */

import type { PlanId } from '@workspace/pricing';
import { PLAN_IDS, PLAN_NAMES } from '@workspace/pricing';

import type {
  AdminFilterStatus,
  AdminProjectSortField,
  AdminRecordingWeeks,
  AdminUserFilterStatus,
  AdminUserSortField,
  AdminWorkspaceFilterStatus,
  AdminWorkspaceSortField,
  DomainStatus,
  SortDirection,
  StreamingStatus,
  UploadStatus,
  WorkspaceInvitePolicy,
  WorkspaceRole,
} from './schemas/common';

// ============================================================================
// OPTION TYPES
// ============================================================================

/**
 * Standard option shape for dropdowns and selects
 */
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Extended option with description (for radio groups, cards, etc.)
 */
export interface SelectOptionWithDescription<T extends string = string> extends SelectOption<T> {
  description: string;
}

// ============================================================================
// SORT & FILTER OPTIONS
// ============================================================================

/**
 * Sort direction options for data tables
 * Maps to SortDirection enum from schemas
 */
export const SORT_DIRECTION_OPTIONS: SelectOption<SortDirection>[] = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
] as const;

// ============================================================================
// WORKSPACE OPTIONS
// ============================================================================

/**
 * Workspace role options for member management
 * Maps to WorkspaceRole enum from schemas
 */
export const WORKSPACE_ROLE_OPTIONS: SelectOptionWithDescription<WorkspaceRole>[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full control over the workspace, including member management and settings',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage team members, workspace settings, and all workspace content',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'View and create content, limited settings access',
  },
] as const;

/**
 * Workspace invite policy options
 * Maps to WorkspaceInvitePolicy enum from schemas
 */
export const WORKSPACE_INVITE_POLICY_OPTIONS: SelectOptionWithDescription<WorkspaceInvitePolicy>[] =
  [
    {
      value: 'private',
      label: 'Private',
      description: 'Only explicit invites can grant access',
    },
    {
      value: 'whitelisted',
      label: 'Whitelisted',
      description: 'Users with matching email domains can join directly',
    },
    {
      value: 'protected',
      label: 'Protected',
      description: 'Users with matching domains can request access (owner approval required)',
    },
  ] as const;

// ============================================================================
// DOMAIN OPTIONS
// ============================================================================

/**
 * Domain verification status options
 * Maps to DomainStatus enum from schemas
 */
export const DOMAIN_STATUS_OPTIONS: SelectOption<DomainStatus>[] = [
  { value: 'pending', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'revoked', label: 'Revoked' },
] as const;

// ============================================================================
// RECORDING OPTIONS
// ============================================================================

/**
 * Recording upload status options
 * Maps to UploadStatus enum from schemas
 */
export const UPLOAD_STATUS_OPTIONS: SelectOption<UploadStatus>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'expired', label: 'Expired' },
  { value: 'purged', label: 'Purged' },
] as const;

/**
 * Recording streaming status options
 * Maps to StreamingStatus enum from schemas
 */
export const STREAMING_STATUS_OPTIONS: SelectOption<StreamingStatus>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
  { value: 'purged', label: 'Purged' },
] as const;

// ============================================================================
// ADMIN OPTIONS
// ============================================================================

/**
 * Admin user sort field options
 */
export const ADMIN_USER_SORT_OPTIONS: SelectOption<AdminUserSortField>[] = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
] as const;

/**
 * Admin user filter status options
 */
export const ADMIN_USER_STATUS_OPTIONS: SelectOption<AdminUserFilterStatus>[] = [
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
] as const;

/**
 * Admin workspace sort field options
 */
export const ADMIN_WORKSPACE_SORT_OPTIONS: SelectOption<AdminWorkspaceSortField>[] = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'name', label: 'Name' },
  { value: 'memberCount', label: 'Members' },
] as const;

/**
 * Admin workspace filter status options
 */
export const ADMIN_WORKSPACE_STATUS_OPTIONS: SelectOption<AdminWorkspaceFilterStatus>[] = [
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deactivated' },
] as const;

/**
 * Admin project sort field options
 */
export const ADMIN_PROJECT_SORT_OPTIONS: SelectOption<AdminProjectSortField>[] = [
  { value: 'created_at', label: 'Created At' },
  { value: 'updated_at', label: 'Updated At' },
  { value: 'project_title', label: 'Name' },
] as const;

/**
 * Admin filter status options (includes 'all' option)
 */
export const ADMIN_FILTER_STATUS_OPTIONS: SelectOption<AdminFilterStatus>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deleted' },
] as const;

/**
 * Admin recording stats weeks to show options
 */
export const ADMIN_RECORDING_WEEKS_OPTIONS: SelectOption<AdminRecordingWeeks>[] = [
  { value: '12', label: '12 Weeks' },
  { value: '24', label: '24 Weeks' },
  { value: '36', label: '36 Weeks' },
  { value: '48', label: '48 Weeks' },
] as const;

// ============================================================================
// PLAN OPTIONS
// ============================================================================

/**
 * Plan options for workspace provisioning and billing
 * Dynamically generated from pricing package
 */
export const PLAN_OPTIONS: SelectOption<PlanId>[] = PLAN_IDS.map((planId) => ({
  value: planId,
  label: PLAN_NAMES[planId],
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get label for a given value from an options array
 *
 * @example
 * ```typescript
 * const label = getOptionLabel(SORT_DIRECTION_OPTIONS, 'desc');
 * // Returns: "Newest First"
 * ```
 */
export function getOptionLabel<T extends string>(
  options: readonly SelectOption<T>[],
  value: T
): string {
  return options.find((opt) => opt.value === value)?.label ?? value;
}

/**
 * Get description for a given value from an options array
 *
 * @example
 * ```typescript
 * const desc = getOptionDescription(WORKSPACE_ROLE_OPTIONS, 'admin');
 * // Returns: "Manage team members, workspace settings, and all workspace content"
 * ```
 */
export function getOptionDescription<T extends string>(
  options: readonly SelectOptionWithDescription<T>[],
  value: T
): string | undefined {
  return options.find((opt) => opt.value === value)?.description;
}
