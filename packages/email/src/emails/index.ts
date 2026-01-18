/**
 * Userplane email templates
 * All lifecycle and transactional emails
 */

// Auth emails (email verification, magic link, workspace invite, access request)
export * from './auth';

// Pilot emails
export * from './pilot';

// Trial emails
export * from './trial';

// Activation emails
export * from './activation';

// Highlight emails (links, recordings, screenshots)
export * from './highlight';

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

// Billing emails
export * from './billing';

// Project emails
export * from './project';

// Usage emails (seats, recordings, screenshots, links)
export * from './usage';

// Shared components
export type { EmailLayoutProps } from '../shared/layout';
export { EmailLayout } from '../shared/layout';
