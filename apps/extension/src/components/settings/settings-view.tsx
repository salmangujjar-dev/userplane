import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@userplane/ui/components/label';
import { Switch } from '@userplane/ui/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import {
  Bell,
  FolderKanban,
  Globe,
  HelpCircle,
  Keyboard,
  Link2,
  LogOut,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { SUPPORT_LINKS } from '@/constants';
import { useExtensionAuth } from '@/hooks/useExtensionAuth';
import { sendMessage } from '@/lib/messaging';
import { useAutoPopulateUrl, useSettingsStore } from '@/stores/settings';
import { useWorkspaceId } from '@/stores/workspace';

import { WorkspaceSwitcher } from './workspace-switcher';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';
const CREATE_RECORDING_LINK_COMMAND = 'create-recording-link';

function openDashPage(workspaceId: string | null, path: string) {
  if (workspaceId) {
    chrome.tabs.create({ url: `${DASH_URL}/workspace/${workspaceId}${path}` });
  }
}

function openChromeShortcutSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

export function SettingsView() {
  const { user, signOut } = useExtensionAuth();
  const workspaceId = useWorkspaceId();
  const autoPopulateUrl = useAutoPopulateUrl();
  const setAutoPopulateUrl = useSettingsStore((s) => s.setAutoPopulateUrl);
  const queryClient = useQueryClient();
  const [isReloading, setIsReloading] = useState(false);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadShortcut = () => {
      chrome.commands.getAll().then((commands) => {
        if (!isMounted) return;

        const createLinkCommand = commands.find(
          (command) => command.name === CREATE_RECORDING_LINK_COMMAND
        );
        setShortcut(createLinkCommand?.shortcut || '');
      });
    };

    loadShortcut();
    window.addEventListener('focus', loadShortcut);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', loadShortcut);
    };
  }, []);

  const handleReload = useCallback(async () => {
    setIsReloading(true);
    try {
      await Promise.all([queryClient.invalidateQueries(), sendMessage({ type: 'CHECK_SESSION' })]);
    } finally {
      setIsReloading(false);
    }
  }, [queryClient]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">Manage your extension preferences</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={SUPPORT_LINKS.helpCenter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Learn more</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Workspace section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Workspace
          </h2>
          <WorkspaceSwitcher />
          <div className="space-y-1">
            <button
              onClick={() => openDashPage(workspaceId, '/settings')}
              className="flex items-start gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <FolderKanban className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Manage Projects</p>
                <p className="text-xs text-muted-foreground">Create and organize your projects</p>
              </div>
            </button>
            <button
              onClick={() => openDashPage(workspaceId, '/settings')}
              className="flex items-start gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Manage Domains</p>
                <p className="text-xs text-muted-foreground">
                  Configure custom domains for your links
                </p>
              </div>
            </button>
            <button
              onClick={() => openDashPage(workspaceId, '/settings?tab=workspace')}
              className="flex items-start gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Settings2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Manage Workspace</p>
                <p className="text-xs text-muted-foreground">Workspace settings and team members</p>
              </div>
            </button>
            <button
              onClick={() => openDashPage(workspaceId, '/settings?tab=notifications')}
              className="flex items-start gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Notification Preferences</p>
                <p className="text-xs text-muted-foreground">Configure email and alert settings</p>
              </div>
            </button>
          </div>
        </div>

        {/* Extension section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Extension
          </h2>
          <div className="flex items-start gap-2 px-3 py-2">
            <Link2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <Label htmlFor="auto-populate" className="text-sm font-medium">
                Prefill Reference
              </Label>
              <p className="text-xs text-muted-foreground">
                Capture the current URL for link reference
              </p>
            </div>
            <Switch
              id="auto-populate"
              checked={autoPopulateUrl}
              onCheckedChange={setAutoPopulateUrl}
              className="shrink-0"
            />
          </div>
          <button
            onClick={openChromeShortcutSettings}
            className="flex items-start gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <Keyboard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Create Link Shortcut</p>
                  <p className="text-xs text-muted-foreground">
                    Open Create Link from anywhere in Chrome
                  </p>
                </div>
                <span className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs font-medium">
                  {shortcut === null ? 'Loading...' : shortcut || 'Not set'}
                </span>
              </div>
            </div>
          </button>
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-start gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-muted-foreground mt-0.5 shrink-0 ${isReloading ? 'animate-spin' : ''}`}
            />
            <div>
              <p className="text-sm font-medium">Reload Extension</p>
              <p className="text-xs text-muted-foreground">Refresh session and cached data</p>
            </div>
          </button>
        </div>

        {/* Account section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Account
          </h2>
          {user && (
            <div className="flex items-center gap-3">
              <BoringAvatar name={user.name} size={AVATAR_SIZES.USER} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => chrome.tabs.create({ url: SUPPORT_LINKS.helpCenter })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm text-left"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Help
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm text-left text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
