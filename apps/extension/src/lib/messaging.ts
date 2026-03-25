export type ExtensionMessage =
  | { type: 'CHECK_SESSION' }
  | { type: 'SIGN_IN' }
  | { type: 'SIGN_OUT' }
  | { type: 'AUTH_EXPIRED' }
  | { type: 'GET_ACTIVE_TAB_URL' };

export interface ActiveTabResponse {
  url: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  emailVerified: boolean;
  image?: string | null;
}

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface SessionCheckResponse {
  authenticated: boolean;
  user?: SessionUser;
  session?: SessionData;
}

export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return chrome.runtime.sendMessage(message);
}
