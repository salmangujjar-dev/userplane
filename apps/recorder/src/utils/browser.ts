/**
 * Browser Detection Utilities
 * Functions for detecting browser, OS, and system capabilities
 */

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
  devicePixelRatio: number;
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
    devicePixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
 * Video MIME types ordered by compression efficiency and quality
 *
 * Priority order:
 * 1. AV1 - Best compression, newest codec (Chrome 100+, Firefox 113+)
 * 2. VP9 - Excellent compression, widely supported
 * 3. H.264 - Hardware acceleration, good compatibility
 * 4. VP8 - Older but universal WebM support
 * 5. Generic containers as fallback
 */
const VIDEO_MIME_TYPES = [
  // AV1 codec (best compression, ~30% better than VP9)
  'video/webm;codecs=av1,opus',
  'video/webm;codecs=av1',
  'video/mp4;codecs=av01.0.04M.08',

  // VP9 codec (excellent compression)
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp9.0,opus',
  'video/webm;codecs=vp9,pcm',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp9.0',

  // H.264 codec (hardware acceleration, Safari support)
  'video/webm;codecs=h264,opus',
  'video/webm;codecs=avc1,opus',
  'video/mp4;codecs=h264,aac',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // Baseline
  'video/mp4;codecs=avc1.4D401F,mp4a.40.2', // Main
  'video/mp4;codecs=avc1.64001F,mp4a.40.2', // High

  // VP8 codec (good compatibility)
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8.0,opus',
  'video/webm;codecs=vp8,pcm',
  'video/webm;codecs=vp8,vp9,opus',
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp8.0',

  // Generic containers (last resort)
  'video/webm',
  'video/mp4',
] as const;

/**
 * Get supported video MIME types for MediaRecorder
 * Returns types in order of preference (best compression first)
 */
export function getSupportedMimeTypes(): string[] {
  if (typeof MediaRecorder === 'undefined') {
    return [];
  }
  return VIDEO_MIME_TYPES.filter((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Get the best supported video MIME type for recording
 * Prefers AV1 > VP9 > H.264 > VP8 > generic
 */
export function getBestMimeType(): string {
  const supported = getSupportedMimeTypes();
  return supported[0] || 'video/webm';
}
