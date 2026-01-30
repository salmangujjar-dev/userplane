/**
 * Auth-related types
 * Types for Better Auth session and user data
 */

/**
 * Session object from Better Auth
 */
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  impersonatedBy?: string;
}

/**
 * User object from Better Auth
 */
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string;
}

/**
 * Combined session data from Better Auth
 */
export interface SessionData {
  session: Session;
  user: User;
}
