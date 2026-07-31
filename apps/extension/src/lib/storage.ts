import type { SessionData, SessionUser } from './messaging';

const STORAGE_KEYS = {
  user: 'session:user',
  session: 'session:data',
  pendingRoute: 'nav:pending-route',
  pendingCreateReference: 'create:pending-reference',
} as const;

type WindowScopedValue<T> = {
  value: T;
  windowId: number;
};

export async function getSessionCache(): Promise<{
  user: SessionUser | null;
  session: SessionData | null;
}> {
  const result = await chrome.storage.session.get([STORAGE_KEYS.user, STORAGE_KEYS.session]);

  return {
    user: (result[STORAGE_KEYS.user] as SessionUser | undefined) ?? null,
    session: (result[STORAGE_KEYS.session] as SessionData | undefined) ?? null,
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

export const SESSION_USER_KEY = STORAGE_KEYS.user;
export const SESSION_DATA_KEY = STORAGE_KEYS.session;
export const PENDING_ROUTE_KEY = STORAGE_KEYS.pendingRoute;
export const PENDING_CREATE_REFERENCE_KEY = STORAGE_KEYS.pendingCreateReference;

export async function setPendingRoute(windowId: number, path: string): Promise<void> {
  await chrome.storage.session.set({
    [STORAGE_KEYS.pendingRoute]: { value: path, windowId } satisfies WindowScopedValue<string>,
  });
}

export async function consumePendingRoute(windowId: number): Promise<string | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.pendingRoute);
  const entry = result[STORAGE_KEYS.pendingRoute] as WindowScopedValue<string> | string | undefined;
  if (!entry) return null;

  const path = typeof entry === 'string' ? entry : entry.windowId === windowId ? entry.value : null;
  if (path) {
    await chrome.storage.session.remove(STORAGE_KEYS.pendingRoute);
  }
  return path;
}

export async function setPendingCreateReference(
  windowId: number,
  reference: string
): Promise<void> {
  await chrome.storage.session.set({
    [STORAGE_KEYS.pendingCreateReference]: {
      value: reference,
      windowId,
    } satisfies WindowScopedValue<string>,
  });
}

export async function consumePendingCreateReference(windowId: number): Promise<string | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.pendingCreateReference);
  const entry = result[STORAGE_KEYS.pendingCreateReference] as
    | WindowScopedValue<string>
    | string
    | undefined;
  if (!entry) return null;

  const reference =
    typeof entry === 'string' ? entry : entry.windowId === windowId ? entry.value : null;
  if (reference) {
    await chrome.storage.session.remove(STORAGE_KEYS.pendingCreateReference);
  }
  return reference;
}
