'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import { Tabs, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { Copy, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useActionLogData, useConsoleLogData, useNetworkLogData } from '@/features/recordings';
import {
  formatActionsAsMarkdown,
  formatConsoleLogsAsMarkdown,
  formatNetworkLogsAsMarkdown,
  formatRecordingInfoAsMarkdown,
} from '@/lib/markdown-formatters';
import { showCopiedToClipboardToast, showCopyFailedToast } from '@/lib/toasts';
import type { RecordingDetail } from '@/types';

type PromptMode = 'explain' | 'fix';

interface AiPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recording: RecordingDetail;
  resources: {
    consoleLog: { url: string | null };
    networkLog: { url: string | null };
    action: { url: string | null };
  };
}

export function AiPromptModal({ open, onOpenChange, recording, resources }: AiPromptModalProps) {
  const [mode, setMode] = useState<PromptMode>('explain');
  const recordingId = recording.recordingId;

  const { data: consoleLogs, isLoading: isLoadingConsole } = useConsoleLogData(
    recordingId,
    recordingId,
    resources.consoleLog.url
  );
  const { data: networkLogs, isLoading: isLoadingNetwork } = useNetworkLogData(
    recordingId,
    recordingId,
    resources.networkLog.url
  );
  const { data: actionLogs, isLoading: isLoadingActions } = useActionLogData(
    recordingId,
    recordingId,
    resources.action.url
  );

  const isLoading = isLoadingConsole || isLoadingNetwork || isLoadingActions;

  const sessionBlock = useMemo(
    () => (isLoading ? null : buildSessionBlock(recording, consoleLogs, networkLogs, actionLogs)),
    [isLoading, recording, consoleLogs, networkLogs, actionLogs]
  );

  const prompt = sessionBlock ? buildPrompt(mode, sessionBlock) : null;

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      showCopiedToClipboardToast('AI prompt');
    } catch {
      showCopyFailedToast();
    }
  };

  const title = mode === 'explain' ? 'Explain this issue' : 'Fix this issue';
  const subtitle = 'Paste into your favourite coding assistant';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        <div className="shrink-0 space-y-4 pt-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as PromptMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="explain" className="text-xs px-3 py-1">
                Explain
              </TabsTrigger>
              <TabsTrigger value="fix" className="text-xs px-3 py-1">
                Fix
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading recording data...</span>
          </div>
        ) : (
          <pre className="min-h-0 flex-1 rounded-lg bg-muted px-4 py-3 text-xs font-mono overflow-auto whitespace-pre">
            {prompt}
          </pre>
        )}

        <DialogFooter className="shrink-0 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full px-6"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            className="rounded-full px-6"
            onClick={handleCopy}
            disabled={isLoading}
          >
            <Copy className="h-4 w-4" />
            Copy to clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Session block (shared between modes)
// ---------------------------------------------------------------------------

function buildSessionBlock(
  recording: RecordingDetail,
  consoleLogs: unknown,
  networkLogs: unknown,
  actionLogs: unknown
): string {
  const hasConsoleLogs = Array.isArray(consoleLogs) && consoleLogs.length > 0;
  const hasNetworkLogs = Array.isArray(networkLogs) && networkLogs.length > 0;
  const hasActionLogs = Array.isArray(actionLogs) && actionLogs.length > 0;

  const parts: string[] = [];

  parts.push(
    '<recording_info>',
    'Recording metadata: project, domain, duration, system info, and custom metadata.',
    '',
    formatRecordingInfoAsMarkdown(recording),
    '</recording_info>'
  );

  if (hasConsoleLogs) {
    parts.push(
      '',
      '<console_logs>',
      'Browser console output captured during the session. Includes errors, warnings, info, and debug messages with stack traces where available.',
      '',
      formatConsoleLogsAsMarkdown(consoleLogs),
      '</console_logs>'
    );
  }

  if (hasNetworkLogs) {
    parts.push(
      '',
      '<network_requests>',
      'HTTP requests and responses captured during the session. Includes method, URL, status, duration, headers, and request/response bodies.',
      '',
      formatNetworkLogsAsMarkdown(networkLogs),
      '</network_requests>'
    );
  }

  if (hasActionLogs) {
    parts.push(
      '',
      '<user_actions>',
      'User interactions captured during the session. Includes clicks, navigations, page loads, and tab switches with timestamps and target elements.',
      '',
      formatActionsAsMarkdown(actionLogs),
      '</user_actions>'
    );
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Mode-specific prompts
// ---------------------------------------------------------------------------

function buildPrompt(mode: PromptMode, sessionBlock: string): string {
  const preamble = `You have been given a Userplane session recording containing screen activity, console logs, network requests, and recording info.

<session>
${sessionBlock}
</session>`;

  if (mode === 'explain') {
    return `${preamble}

Respond in three sections. Use the section titles exactly as written below.

---

## What happened

Walk through what the customer did, what the app tried to do, and where it broke down — in plain language. Reference specific actions and timestamps from the session.

## Why it happened

The technical root cause in 2–4 sentences. Reference the exact request, error message, component, or any reference from the shared session data. Write this so the customer can paste it directly into a ticket or Slack message to their dev team.

## How to fix it

If there are multiple issues, address each one separately with a clear heading.

For each issue, split steps by ownership:

**Customer can do now:**
- Actionable steps requiring no code changes

**Dev team needs to fix:**
- Code-level changes required

If a section has nothing to add, omit it rather than writing "N/A".`;
  }

  // Fix mode — engineer-oriented
  return `${preamble}

You are a senior engineer debugging a production issue. Respond in three sections. Use the section titles exactly as written below.

---

## Root cause

Identify the root cause. Reference the exact failing request (method, URL, status), error message, or console error with timestamp. Be precise — quote from the session data.

## Affected code paths

List the specific components, API endpoints, or services involved. For each, explain what went wrong and why. If a request failed, note the request/response details. If a console error has a stack trace, reference the relevant frames.

## Fix

For each issue found, provide:

**Immediate mitigation:**
- Steps to restore service or unblock the user right now (config changes, feature flags, rollbacks, retries)

**Code changes required:**
- Specific code-level fixes with enough detail to write a PR description. Include the endpoint or component name, what to change, and why.

**Prevention:**
- What to add so this class of issue is caught earlier (validation, error handling, monitoring, tests)

If a section has nothing to add, omit it rather than writing "N/A".`;
}
