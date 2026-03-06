import type { RecordingActionLog } from '@/components/recordings/action-types';
import { formatActionLabel, formatActionTarget } from '@/components/recordings/action-types';
import type { RecordingConsoleLog } from '@/components/recordings/console-log-types';
import { formatSerializedValue, formatTimestamp } from '@/components/recordings/console-log-types';
import type { RecordingNetworkLog } from '@/components/recordings/network-types';
import { formatTime } from '@/components/recordings/network-types';
import type { RecordingDetail } from '@/types';

export function formatConsoleLogsAsMarkdown(logs: RecordingConsoleLog[]): string {
  const lines: string[] = ['# Console Logs', ''];

  // Summary by level
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const level = log.type || 'log';
    counts[level] = (counts[level] || 0) + 1;
  }
  const summary = Object.entries(counts)
    .map(([level, count]) => `${count} ${level}`)
    .join(', ');
  lines.push(`**Total:** ${logs.length} logs (${summary})`, '');

  // Entries
  for (const log of logs) {
    const time = formatTimestamp(log.timestamp);
    const level = (log.type || 'log').toUpperCase();
    const message = log.args.map((arg) => formatSerializedValue(arg)).join(' ');
    lines.push(`[${time}] [${level}] ${message}`);

    if (log.trace && log.trace.length > 0) {
      for (const frame of log.trace) {
        lines.push(`    at ${frame}`);
      }
    }
  }

  return lines.join('\n');
}

export function formatNetworkLogsAsMarkdown(logs: RecordingNetworkLog[]): string {
  const lines: string[] = ['# Network Requests', ''];

  // Summary
  const statusRanges: Record<string, number> = {};
  for (const log of logs) {
    const range =
      log.status >= 500
        ? '5xx'
        : log.status >= 400
          ? '4xx'
          : log.status >= 300
            ? '3xx'
            : log.status >= 200
              ? '2xx'
              : 'other';
    statusRanges[range] = (statusRanges[range] || 0) + 1;
  }
  const summary = Object.entries(statusRanges)
    .map(([range, count]) => `${count} ${range}`)
    .join(', ');
  lines.push(`**Total:** ${logs.length} requests (${summary})`, '');

  // Entries
  for (const log of logs) {
    const duration = formatTime(log.duration);
    lines.push(`[${log.method}] ${log.url} - ${log.status} ${log.statusText} (${duration})`);

    // Request headers
    if (log.requestHeaders && Object.keys(log.requestHeaders).length > 0) {
      lines.push('  Request Headers:');
      for (const [key, value] of Object.entries(log.requestHeaders)) {
        lines.push(`    ${key}: ${value}`);
      }
    }

    // Request body
    if (log.requestBody?.body) {
      const bodyStr =
        typeof log.requestBody.body === 'string'
          ? log.requestBody.body
          : JSON.stringify(log.requestBody.body, null, 2);
      const truncated =
        bodyStr.length > 2000 ? bodyStr.slice(0, 2000) + '... (truncated)' : bodyStr;
      lines.push(`  Request Body (${log.requestBody.type}):`);
      lines.push(`    ${truncated}`);
    }

    // Response headers
    if (log.responseHeaders && Object.keys(log.responseHeaders).length > 0) {
      lines.push('  Response Headers:');
      for (const [key, value] of Object.entries(log.responseHeaders)) {
        lines.push(`    ${key}: ${value}`);
      }
    }

    // Response body
    if (log.responseBody) {
      const bodyStr =
        typeof log.responseBody === 'string'
          ? log.responseBody
          : JSON.stringify(log.responseBody, null, 2);
      const truncated =
        bodyStr.length > 2000 ? bodyStr.slice(0, 2000) + '... (truncated)' : bodyStr;
      lines.push('  Response Body:');
      lines.push(`    ${truncated}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

export function formatActionsAsMarkdown(actions: RecordingActionLog[]): string {
  const lines: string[] = ['# User Actions', ''];

  for (const action of actions) {
    const time = formatTimestamp(action.timestamp);
    const label = formatActionLabel(action.data.action);
    lines.push(`[${time}] ${label}`);

    const target = formatActionTarget(action.data);
    if (target) {
      lines.push(`  Target: ${target}`);
    }

    if (action.data.url) {
      lines.push(`  URL: ${action.data.url}`);
    }

    if (action.data.from && action.data.to) {
      lines.push(`  From: ${action.data.from}`);
      lines.push(`  To: ${action.data.to}`);
    }
  }

  return lines.join('\n');
}

function parseSystemMeta(raw: Record<string, unknown>) {
  return {
    os: raw.os ? String(raw.os) : null,
    osVersion: raw.osVersion ? String(raw.osVersion) : null,
    browser: raw.browser ? String(raw.browser) : null,
    browserVersion: raw.browserVersion ? String(raw.browserVersion) : null,
    date: raw.date ? String(raw.date) : null,
    time: raw.time ? String(raw.time) : null,
    timezone: raw.timezone ? String(raw.timezone) : null,
    language: raw.language ? String(raw.language) : null,
    screenSize: raw.screenSize ? String(raw.screenSize) : null,
    windowSize: raw.windowSize ? String(raw.windowSize) : null,
  };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatRecordingInfoAsMarkdown(recording: RecordingDetail): string {
  const { meta } = recording;
  const lines: string[] = ['# Recording Info', ''];

  // About
  lines.push('## About', '');
  lines.push(`- **Link Title:** ${meta.link.title || 'Untitled'}`);
  if (meta.project.title) {
    lines.push(`- **Project:** ${meta.project.title}`);
  }
  lines.push(`- **Domain:** ${meta.domain.url}`);
  lines.push(`- **Duration:** ${formatDuration(recording.recordingDurationMs)}`);
  lines.push(`- **Requested By:** ${meta.creator.name}`);
  lines.push(`- **Requested At:** ${new Date(meta.createdAt).toISOString()}`);
  if (meta.expiresAt) {
    lines.push(`- **Expires At:** ${new Date(meta.expiresAt).toISOString()}`);
  }
  lines.push('');

  // Notes
  if (meta.notes) {
    lines.push('## Notes', '');
    lines.push(meta.notes, '');
  }

  // Integration
  if (meta.link.providerType) {
    lines.push('## Integration', '');
    lines.push(`- **Provider:** ${meta.link.providerType}`);
    if (meta.link.providerRef) {
      lines.push(`- **Reference:** ${meta.link.providerRef}`);
    }
    if (meta.link.providerData) {
      lines.push(`- **Data:** ${JSON.stringify(meta.link.providerData, null, 2)}`);
    }
    lines.push('');
  }

  // System
  if (meta.systemMeta && Object.keys(meta.systemMeta).length > 0) {
    const sys = parseSystemMeta(meta.systemMeta);
    lines.push('## System', '');
    if (sys.os) lines.push(`- **OS:** ${sys.os}${sys.osVersion ? ` ${sys.osVersion}` : ''}`);
    if (sys.browser)
      lines.push(
        `- **Browser:** ${sys.browser}${sys.browserVersion ? ` ${sys.browserVersion}` : ''}`
      );
    if (sys.date || sys.time)
      lines.push(`- **Captured At:** ${[sys.date, sys.time].filter(Boolean).join(' ')}`);
    if (sys.timezone) lines.push(`- **Timezone:** ${sys.timezone}`);
    if (sys.language) lines.push(`- **Language:** ${sys.language}`);
    if (sys.screenSize) lines.push(`- **Screen Size:** ${sys.screenSize}`);
    if (sys.windowSize) lines.push(`- **Window Size:** ${sys.windowSize}`);
    lines.push('');
  }

  // Custom Metadata
  if (meta.customMeta && Object.keys(meta.customMeta).length > 0) {
    lines.push('## Custom Metadata', '');
    for (const [key, value] of Object.entries(meta.customMeta)) {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      lines.push(`- **${key}:** ${valStr}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
