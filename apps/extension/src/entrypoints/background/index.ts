import { SUPPORT_LINKS } from '@/constants';
import { authClient } from '@/lib/auth-client';
import type { ExtensionMessage, SessionCheckResponse } from '@/lib/messaging';
import {
  clearSessionCache,
  setPendingCreateReference,
  setPendingRoute,
  setSessionCache,
} from '@/lib/storage';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

const MENU_IDS = {
  ACTION_CREATE: 'action-create-link',
  ACTION_VIEW_LINKS: 'action-view-links',
  ACTION_VIEW_RECORDINGS: 'action-view-recordings',
  ACTION_HELP: 'action-help',
  PAGE_CREATE: 'page-create-link',
} as const;

async function setupContextMenus() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_IDS.ACTION_CREATE,
    title: 'Create Recording Link',
    contexts: ['action'],
  });
  chrome.contextMenus.create({
    id: MENU_IDS.ACTION_VIEW_LINKS,
    title: 'View Recording Links',
    contexts: ['action'],
  });
  chrome.contextMenus.create({
    id: MENU_IDS.ACTION_VIEW_RECORDINGS,
    title: 'View Received Recordings',
    contexts: ['action'],
  });
  chrome.contextMenus.create({
    id: 'action-separator',
    type: 'separator',
    contexts: ['action'],
  });
  chrome.contextMenus.create({
    id: MENU_IDS.ACTION_HELP,
    title: 'Help',
    contexts: ['action'],
  });
  chrome.contextMenus.create({
    id: MENU_IDS.PAGE_CREATE,
    title: 'Create Recording Link',
    contexts: ['page'],
  });
}

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
  chrome.sidePanel.setOptions({ enabled: true }).catch((error) => {
    console.error('Failed to enable side panel', error);
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error('Failed to enable side panel action click behavior', error);
  });
  chrome.omnibox.setDefaultSuggestion({
    description:
      '<match>Userplane - Create Recording Link</match> <dim>Type a customer, ticket, or URL reference</dim>',
  });

  // Create context menus and check session on install/update
  chrome.runtime.onInstalled.addListener(() => {
    void checkSession();
    void setupContextMenus().catch((error) => {
      console.error('Failed to create context menus', error);
    });
  });
  chrome.runtime.onStartup.addListener(() => {
    void setupContextMenus().catch((error) => {
      console.error('Failed to refresh context menus on startup', error);
    });
  });

  // Open side panel at a specific route
  async function openSidePanelAt(windowId: number, path: string, createReference?: string) {
    // `sidePanel.open()` must run directly from the user gesture. Persist the
    // target route afterwards so a fresh panel can consume it on mount and an
    // already-open panel can react via storage.onChanged.
    await chrome.sidePanel.open({ windowId });

    const trimmedReference = createReference?.trim();
    if (trimmedReference) {
      await setPendingCreateReference(trimmedReference);
    }

    await setPendingRoute(path);
  }

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const windowId = tab?.windowId;

    void (async () => {
      switch (info.menuItemId) {
        case MENU_IDS.ACTION_CREATE:
        case MENU_IDS.PAGE_CREATE:
          if (windowId != null) await openSidePanelAt(windowId, '/create');
          break;
        case MENU_IDS.ACTION_VIEW_LINKS:
          if (windowId != null) await openSidePanelAt(windowId, '/');
          break;
        case MENU_IDS.ACTION_VIEW_RECORDINGS:
          if (windowId != null) await openSidePanelAt(windowId, '/recordings');
          break;
        case MENU_IDS.ACTION_HELP:
          await chrome.tabs.create({ url: SUPPORT_LINKS.helpCenter });
          break;
      }
    })().catch((error) => {
      console.error('Failed to handle context menu click', error);
    });
  });

  chrome.omnibox.onInputEntered.addListener((text) => {
    void openSidePanelAt(chrome.windows.WINDOW_ID_CURRENT, '/create', text).catch((error) => {
      console.error('Failed to open create link flow from omnibox', error);
    });
  });
});
