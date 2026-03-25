import type { SessionData, SessionUser } from './messaging';

const STORAGE_KEYS = {
  user: 'session:user',
  session: 'session:data',
  pendingRoute: 'nav:pending-route',
  pendingCreateReference: 'create:pending-reference',
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
export const PENDING_CREATE_REFERENCE_KEY = STORAGE_KEYS.pendingCreateReference;

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

export async function setPendingCreateReference(reference: string): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEYS.pendingCreateReference]: reference });
}

export async function consumePendingCreateReference(): Promise<string | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.pendingCreateReference);
  const reference = result[STORAGE_KEYS.pendingCreateReference] ?? null;
  if (reference) {
    await chrome.storage.session.remove(STORAGE_KEYS.pendingCreateReference);
  }
  return reference;
}
