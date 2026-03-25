import { authClient } from '@/lib/auth-client';
import type { ExtensionMessage, SessionCheckResponse } from '@/lib/messaging';
import { clearSessionCache, setSessionCache } from '@/lib/storage';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

async function checkSession(): Promise<SessionCheckResponse> {
  try {
    const { data, error } = await authClient.getSession();

    if (error || !data) {
      await clearSessionCache();
      return { authenticated: false };
    }

    await setSessionCache(data.user, data.session);
    return { authenticated: true, user: data.user, session: data.session };
  } catch {
    await clearSessionCache();
    return { authenticated: false };
  }
}

async function launchAuthFlow(): Promise<SessionCheckResponse> {
  const redirectUrl = chrome.identity.getRedirectURL();
  const authUrl = `${DASH_URL}/auth?redirect_to=/extension/auth?ext_redirect=${encodeURIComponent(redirectUrl)}`;

  try {
    await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });

    // After auth flow completes, the session cookie is set on .userplane.io
    // Re-check session to confirm authentication
    return await checkSession();
  } catch {
    return { authenticated: false };
  }
}

async function handleSignOut(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    // Sign out best-effort
  }
  await clearSessionCache();
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'CHECK_SESSION') {
      checkSession().then(sendResponse);
      return true;
    }

    if (message.type === 'SIGN_IN') {
      launchAuthFlow().then(sendResponse);
      return true;
    }

    if (message.type === 'SIGN_OUT') {
      handleSignOut().then(sendResponse);
      return true;
    }

    if (message.type === 'AUTH_EXPIRED') {
      clearSessionCache().then(sendResponse);
      return true;
    }

    if (message.type === 'GET_ACTIVE_TAB_URL') {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        sendResponse({ url: tabs[0]?.url ?? null });
      });
      return true;
    }
  });

  // Register side panel
  chrome.sidePanel.setOptions({ enabled: true });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Check session on extension install/update
  chrome.runtime.onInstalled.addListener(() => {
    checkSession();
  });
});
