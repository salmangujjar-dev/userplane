/**
 * @workspace/contract
 *
 * Userplane API contract definitions using oRPC
 * Provides type-safe API contracts for client generation and validation
 */

// Export individual domain contracts
export {
  accountContract,
  contract,
  diagnosticsContract,
  domainContract,
  inviteContract,
  linkContract,
  projectContract,
  provisionerContract,
  recordingContract,
  sessionContract,
  statusContract,
  workspaceContract,
} from './contract';

// Export contract types
export type {
  AccountContract,
  Contract,
  DiagnosticsContract,
  DomainContract,
  InviteContract,
  LinkContract,
  ProjectContract,
  ProvisionerContract,
  RecordingContract,
  SessionContract,
  StatusContract,
  WorkspaceContract,
} from './contract';

// Export all schemas for custom usage
export * from './schemas';

// Export all constants
export * from './constants';

// Export UI options
export * from './ui-options';

// Export utility functions
export * from './utils/errors';
export * from './utils/token';
export * from './utils/url';
