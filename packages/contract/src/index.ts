/**
 * @userplane/contract
 *
 * Userplane API contract definitions using oRPC
 * Provides type-safe API contracts for client generation and validation
 */

// Export individual domain contracts
export {
  accountContract,
  apiKeyContract,
  contract,
  diagnosticsContract,
  domainContract,
  inviteContract,
  linkContract,
  projectContract,
  provisionerContract,
  publicApiContract,
  recordingContract,
  sessionContract,
  shareContract,
  statusContract,
  workspaceContract,
  zendeskAppContract,
} from './contract';

// Export contract types
export type {
  AccountContract,
  ApiKeyContract,
  Contract,
  DiagnosticsContract,
  DomainContract,
  InviteContract,
  LinkContract,
  ProjectContract,
  ProvisionerContract,
  PublicApiContract,
  RecordingContract,
  SessionContract,
  ShareContract,
  StatusContract,
  WorkspaceContract,
  ZendeskAppContract,
} from './contract';

// Export all schemas for custom usage
export * from './schemas';

// Export all constants
export * from './constants';

// Export UI options
export * from './ui-options';

// Export public API schemas and errors
export * from './public';

// Export utility functions
export * from './utils/errors';
export * from './utils/token';
export * from './utils/url';
