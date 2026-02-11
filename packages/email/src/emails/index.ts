/**
 * Userplane email templates
 * All lifecycle and transactional emails
 */

// Auth emails (email verification, magic link, workspace invite, access request)
export * from './auth';

// Offboarding emails
export * from './offboarding';

// Workspace emails
export * from './workspace';

// Invite emails
export * from './invite';

// Recording emails
export * from './recording';

// Domain emails
export * from './domain';

// Project emails
export * from './project';

// Onboarding emails
export * from './onboarding';

// Shared components
export type { EmailLayoutProps } from '../shared/layout';
export { EmailLayout } from '../shared/layout';
