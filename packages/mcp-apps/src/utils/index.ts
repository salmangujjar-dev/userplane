import { type ClassValue, clsx } from 'clsx';
import { useCallback, useState } from 'react';
import { twMerge } from 'tailwind-merge';

/** Tailwind class merge utility (matches @userplane/ui's cn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Stateful Set with a stable toggle callback — used by tab filter pills.
 * Adding a key that's present removes it; adding a missing key inserts it.
 */
export function useToggleSet<T>(): readonly [Set<T>, (value: T) => void] {
  const [set, setSet] = useState<Set<T>>(new Set());
  const toggle = useCallback((value: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);
  return [set, toggle];
}

/**
 * JSON.stringify that never throws. Returns `String(value)` if the value is
 * circular, contains BigInt, or is otherwise not serializable.
 */
export function safeStringify(value: unknown, space?: number): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return String(value);
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return String(value);
  }
}

/** Format milliseconds as M:SS (e.g. 3:07). */
export function formatDuration(ms: number | null): string {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Format a date as relative text (Today, Yesterday, X days ago, etc.). */
export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString();
}

/** Format a date as "MMM dd, yyyy HH:mm:ss". */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-US', { hour12: false });
  return `${month} ${day}, ${year} ${time}`;
}

/** Format a timestamp relative to a recording start time as MM:SS. */
export function formatTimestamp(timestampMs: number, startTimeMs?: number): string {
  if (!startTimeMs) return '--:--';
  const relativeMs = Math.max(0, timestampMs - startTimeMs);
  const totalSeconds = Math.floor(relativeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** Check if a string is a valid URL. */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/** Extract hostname from a URL string. */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/** Extract the filename (last path segment) from a URL. */
export function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || pathname;
  } catch {
    return url;
  }
}

/** Format a network duration value. */
export function formatNetworkDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
