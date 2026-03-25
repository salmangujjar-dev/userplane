import type { SessionData, SessionUser } from './messaging';

const STORAGE_KEYS = {
  user: 'session:user',
  session: 'session:data',
  pendingRoute: 'nav:pending-route',
} as const;

export async function getSessionCache(): Promise<{
  user: SessionUser | null;
  session: SessionData | null;
}> {
  const result = await chrome.storage.session.get([STORAGE_KEYS.user, STORAGE_KEYS.session]);

  return {
    user: result[STORAGE_KEYS.user] ?? null,
    session: result[STORAGE_KEYS.session] ?? null,
  };
}

export async function setSessionCache(user: SessionUser, session: SessionData): Promise<void> {
  await chrome.storage.session.set({
    [STORAGE_KEYS.user]: user,
    [STORAGE_KEYS.session]: session,
  });
}

export async function clearSessionCache(): Promise<void> {
  await chrome.storage.session.remove([STORAGE_KEYS.user, STORAGE_KEYS.session]);
}

export const PENDING_ROUTE_KEY = STORAGE_KEYS.pendingRoute;

export async function setPendingRoute(path: string): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEYS.pendingRoute]: path });
}

export async function consumePendingRoute(): Promise<string | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.pendingRoute);
  const path = result[STORAGE_KEYS.pendingRoute] ?? null;
  if (path) {
    await chrome.storage.session.remove(STORAGE_KEYS.pendingRoute);
  }
  return path;
}
