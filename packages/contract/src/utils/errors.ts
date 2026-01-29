/**
 * Typelocked error utilities for creating ORPCError instances
 * Ensures error definitions in the contract stay in sync with thrown errors
 */

import { ORPCError } from '@orpc/server';

import { AccountErrors } from '../schemas/account.errors';
import { AdminErrors } from '../schemas/admin.errors';
import { BillingErrors } from '../schemas/billing.errors';
import { DomainErrors } from '../schemas/domain.errors';
import { IntercomErrors } from '../schemas/intercom.errors';
import { InviteErrors } from '../schemas/invite.errors';
import { LinkErrors } from '../schemas/link.errors';
import { ProjectErrors } from '../schemas/project.errors';
import { ProvisionerErrors } from '../schemas/provisioner.errors';
import { RecordingErrors } from '../schemas/recording.errors';
import { SessionErrors } from '../schemas/session.errors';
import { WorkspaceErrors } from '../schemas/workspace.errors';

/**
 * Error definition structure used across all error modules
 */
export type ErrorDefinition = {
  status: number;
  message: string;
};

/**
 * Type for error definition maps (e.g., WorkspaceErrors, ProjectErrors)
 */
export type ErrorMap = Record<string, ErrorDefinition>;

/**
 * Type for error factory - maps each key to a function that creates an ORPCError
 * Supports optional data parameter for additional error context
 */
export type ErrorFactory<T extends ErrorMap> = {
  [K in keyof T & string]: {
    (): ORPCError<K, undefined>;
    <TData>(data: TData): ORPCError<K, TData>;
  };
};

/**
 * Creates a typelocked error factory from error definitions.
 * Returns an object with methods for each error key that create ORPCError instances.
 */
function createErrors<T extends ErrorMap>(definitions: T): ErrorFactory<T> {
  const factory = {} as ErrorFactory<T>;

  for (const key of Object.keys(definitions) as (keyof T & string)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    factory[key] = ((data?: any) => {
      if (data !== undefined) {
        return new ORPCError(key, { ...definitions[key], data });
      }
      return new ORPCError(key, definitions[key]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  }

  return factory;
}

/**
 * Pre-built error factories for use throughout services and handlers.
 * Import and throw directly:
 *
 * @example
 * import { accountError, workspaceError } from '@workspace/contract';
 *
 * // Without additional data
 * throw workspaceError.WORKSPACE_NOT_FOUND();
 * throw accountError.UNAUTHORIZED();
 *
 * // With additional data
 * throw workspaceError.WORKSPACE_RESTORE_TIME_EXPIRED({
 *   deletedAt: deletedAt.toISOString(),
 *   daysSinceDeletion: 15,
 *   restorationWindowDays: 7,
 * });
 */
export const accountError = createErrors(AccountErrors);
export const adminError = createErrors(AdminErrors);
export const billingError = createErrors(BillingErrors);
export const domainError = createErrors(DomainErrors);
export const intercomError = createErrors(IntercomErrors);
export const inviteError = createErrors(InviteErrors);
export const linkError = createErrors(LinkErrors);
export const projectError = createErrors(ProjectErrors);
export const provisionerError = createErrors(ProvisionerErrors);
export const recordingError = createErrors(RecordingErrors);
export const sessionError = createErrors(SessionErrors);
export const workspaceError = createErrors(WorkspaceErrors);
