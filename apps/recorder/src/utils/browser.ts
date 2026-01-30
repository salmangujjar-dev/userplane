/**
 * Browser Detection Utilities
 * Functions for detecting browser, OS, and system capabilities
 */

import { VIDEO_MIME_TYPES } from '@/constants';

/**
 * Application mode indicating whether the recorder is running embedded (iframe) or standalone
 */
export type AppMode = 'embedded' | 'standalone';

/**
 * Detect if the application is running inside an iframe (embedded mode) or as a standalone page
 * Returns 'embedded' when running inside an iframe, 'standalone' otherwise
 */
export function detectAppMode(): AppMode {
  try {
    // window.self !== window.top is true when inside an iframe
    // This check may throw a SecurityError in cross-origin scenarios, which still means embedded
    return window.self !== window.top ? 'embedded' : 'standalone';
  } catch {
    // Cross-origin iframe restrictions throw an error when accessing window.top
    // If we can't access window.top, we're definitely in an iframe
    return 'embedded';
  }
}

/**
 * Check if the application is running in embedded mode (inside an iframe)
 */
export function isEmbedded(): boolean {
  return detectAppMode() === 'embedded';
}

/**
 * Check if the application is running in standalone mode (not in an iframe)
 */
export function isStandalone(): boolean {
  return detectAppMode() === 'standalone';
}

export interface BrowserInfo {
  name: string;
  version: string | null;
}

export interface OSInfo {
  name: string;
  version: string | null;
}

export interface SystemMetadata {
  date: string;
  time: string;
  browser: string;
  browserVersion: string | null;
  os: string;
  osVersion: string | null;
  windowSize: {
    width: number;
    height: number;
  };
  screenSize: {
    width: number;
    height: number;
  };
  language: string;
  timezone: string;
}

/**
 * Detect the user's browser
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;

  // Order matters - check more specific browsers first
  if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+(?:\.\d+)?)/);
    return { name: 'Firefox', version: match?.[1] ?? null };
  }

  if (ua.includes('Edg')) {
    const match = ua.match(/Edg\/(\d+(?:\.\d+)?)/);
    return { name: 'Edge', version: match?.[1] ?? null };
  }

  if (ua.includes('OPR') || ua.includes('Opera')) {
    const match = ua.match(/(?:OPR|Opera)\/(\d+(?:\.\d+)?)/);
    return { name: 'Opera', version: match?.[1] ?? null };
  }

  if (ua.includes('Chrome')) {
    const match = ua.match(/Chrome\/(\d+(?:\.\d+)?)/);
    return { name: 'Chrome', version: match?.[1] ?? null };
  }

  if (ua.includes('Safari')) {
    const match = ua.match(/Version\/(\d+(?:\.\d+)?)/);
    return { name: 'Safari', version: match?.[1] ?? null };
  }

  return { name: 'Unknown', version: null };
}

/**
 * Detect the user's operating system
 */
export function detectOS(): OSInfo {
  const ua = navigator.userAgent;

  if (ua.includes('Win')) {
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    const version = match?.[1];
    const versionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    return {
      name: 'Windows',
      version: version ? versionMap[version] || version : null,
    };
  }

  if (ua.includes('Mac')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/);
    const version = match?.[1]?.replace(/_/g, '.');
    return { name: 'macOS', version: version ?? null };
  }

  if (ua.includes('Linux')) {
    if (ua.includes('Android')) {
      const match = ua.match(/Android (\d+(?:\.\d+)?)/);
      return { name: 'Android', version: match?.[1] ?? null };
    }
    return { name: 'Linux', version: null };
  }

  if (ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS (\d+[._]\d+(?:[._]\d+)?)/);
    const version = match?.[1]?.replace(/_/g, '.');
    return { name: 'iOS', version: version ?? null };
  }

  // Fallback: check userAgentData if available (modern browsers)
  if ('userAgentData' in navigator) {
    // userAgentData is not yet in TypeScript's Navigator type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uaData = (navigator as any).userAgentData;
    if (uaData?.platform) {
      return { name: uaData.platform, version: null };
    }
  }

  return { name: 'Unknown', version: null };
}

/**
 * Capture comprehensive system metadata
 */
export function captureSystemMetadata(): SystemMetadata {
  const now = new Date();
  const browser = detectBrowser();
  const os = detectOS();

  return {
    date: now.toISOString().split('T')[0],
    time: now.toISOString().split('T')[1].split('.')[0],
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
    },
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Convert system metadata to pretty format for storage/display
 * Flattens structure and formats keys with spaces and readable values
 */
export function prettySystemMetadata(
  metadata: SystemMetadata
): Record<string, string | number | null> {
  return {
    date: metadata.date,
    time: metadata.time,
    browser: metadata.browser,
    browserVersion: metadata.browserVersion,
    os: metadata.os,
    osVersion: metadata.osVersion,
    windowSize: `${metadata.windowSize.width} x ${metadata.windowSize.height}`,
    screenSize: `${metadata.screenSize.width} x ${metadata.screenSize.height}`,
    language: metadata.language,
    timezone: metadata.timezone,
  };
}

/**
 * Check if the browser supports screen recording
 */
export function isScreenRecordingSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

/**
 * Check if system audio capture is supported (Chromium-based browsers only)
 */
export function isSystemAudioSupported(): boolean {
  const browser = detectBrowser();
  const chromiumBrowsers = ['Chrome', 'Edge', 'Opera'];
  return chromiumBrowsers.includes(browser.name) && isScreenRecordingSupported();
}

/**
 * Get supported video MIME types for MediaRecorder
 * Returns types in order of preference (best compression first)
 */
export function getSupportedMimeTypes(): string[] {
  if (typeof MediaRecorder === 'undefined') {
    return [];
  }
  return VIDEO_MIME_TYPES.filter((type: string) => MediaRecorder.isTypeSupported(type));
}

/**
 * Get the best supported video MIME type for recording
 * Prefers AV1 > VP9 > H.264 > VP8 > generic
 */
export function getBestMimeType(): string {
  const supported = getSupportedMimeTypes();
  return supported[0] || 'video/webm';
}
