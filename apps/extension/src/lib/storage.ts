import type { SessionData, SessionUser } from './messaging';

const STORAGE_KEYS = {
  user: 'session:user',
  session: 'session:data',
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
