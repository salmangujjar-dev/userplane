/**
 * Userplane Recorder SDK
 * Auto-mounts recorder iframe when userplane-action=recording is detected
 *
 * Usage:
 *   <meta name="userplane:workspace" content="ws_xxx" />
 *   <script type="module" src="https://cdn.userplane.com/recorder.js"></script>
 */

interface RecorderFrame {
  overlay: HTMLDivElement;
  iframe: HTMLIFrameElement;
}

class UserplaneRecorder {
  private static instance: UserplaneRecorder | null = null;
  private recorderFrame: RecorderFrame | null = null;
  private workspaceId: string | null = null;
  private recorderUrl: string = 'http://localhost:4322/r';

  private constructor() {
    this.readWorkspaceId();
    this.checkAndMountRecorder();
  }

  public static initialize(): UserplaneRecorder {
    if (!UserplaneRecorder.instance) {
      UserplaneRecorder.instance = new UserplaneRecorder();
    }
    return UserplaneRecorder.instance;
  }

  private readWorkspaceId(): void {
    const metaTag = document.querySelector('meta[name="userplane:workspace"]');
    if (metaTag) {
      this.workspaceId = metaTag.getAttribute('content');
      console.log('[Userplane] Workspace ID:', this.workspaceId);
    } else {
      console.warn(
        '[Userplane] No workspace meta tag found. Add: <meta name="userplane:workspace" content="ws_xxx" />'
      );
    }
  }

  private checkAndMountRecorder(): void {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('userplane-action');
    const token = params.get('userplane-token');

    if (action === 'recording' && token) {
      if (!this.workspaceId) {
        console.error('[Userplane] Recording action detected but no workspace ID in meta tag');
        return;
      }
      console.log('[Userplane] Recording action detected, mounting recorder');
      this.mountRecorder(token, action);
    }
  }

  private mountRecorder(token: string, action: string): void {
    if (this.recorderFrame) {
      console.warn('[Userplane] Recorder is already mounted');
      return;
    }

    if (document.querySelector('iframe[data-userplane-recorder]')) {
      throw new Error('[Userplane] Another Userplane recorder is already open');
    }

    console.log('[Userplane] Creating recorder iframe');
    console.log('[Userplane] Token:', token.substring(0, 20) + '...');
    console.log('[Userplane] Action:', action);
    console.log('[Userplane] Workspace (from meta):', this.workspaceId);

    const overlay = document.createElement('div');
    const iframe = document.createElement('iframe');

    const url = new URL(this.recorderUrl);
    url.searchParams.set('userplane-token', token);
    url.searchParams.set('userplane-action', action);
    if (this.workspaceId) {
      url.searchParams.set('userplane-workspace', this.workspaceId);
    }

    console.log('[Userplane] Iframe URL:', url.toString());
    iframe.src = url.toString();

    this.styleOverlay(overlay);
    this.styleIframe(iframe);
    this.configureIframe(iframe);

    overlay.appendChild(iframe);

    this.recorderFrame = { overlay, iframe };

    this.mount();
  }

  private styleOverlay(overlay: HTMLDivElement): void {
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2147483647';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.pointerEvents = 'none';
  }

  private styleIframe(iframe: HTMLIFrameElement): void {
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.pointerEvents = 'auto';
    iframe.style.border = 'none';
  }

  private configureIframe(iframe: HTMLIFrameElement): void {
    iframe.dataset.userplaneRecorder = '';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
    iframe.setAttribute('allow', 'microphone; camera; display-capture');
    iframe.setAttribute('allowfullscreen', 'true');

    iframe.addEventListener('error', () => {
      console.error('[Userplane] Error loading recorder iframe');
    });

    iframe.addEventListener('load', () => {
      console.log('[Userplane] Recorder iframe loaded successfully');
    });
  }

  private mount(): void {
    if (!this.recorderFrame) {
      throw new Error('[Userplane] No recorder frame to mount');
    }

    if (document.contains(this.recorderFrame.overlay)) {
      console.warn('[Userplane] Recorder is already in the DOM');
      return;
    }

    const mountFn = () => {
      if (document.readyState !== 'loading') {
        document.body.appendChild(this.recorderFrame!.overlay);
        document.removeEventListener('readystatechange', mountFn);
        this.recorderFrame!.iframe.focus();
        console.log('[Userplane] Recorder mounted to DOM');
      }
    };

    document.addEventListener('readystatechange', mountFn);
    mountFn();
  }

  public unmount(): void {
    if (!this.recorderFrame) {
      return;
    }

    if (document.contains(this.recorderFrame.overlay)) {
      document.body.removeChild(this.recorderFrame.overlay);
      console.log('[Userplane] Recorder unmounted from DOM');
    }

    this.recorderFrame = null;
  }

  public isRecorderMounted(): boolean {
    return this.recorderFrame !== null && document.contains(this.recorderFrame.overlay);
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  UserplaneRecorder.initialize();
}

// Expose to window for programmatic access
declare global {
  interface Window {
    Userplane?: {
      recorder?: UserplaneRecorder;
    };
  }
}

if (typeof window !== 'undefined') {
  window.Userplane = {
    recorder: UserplaneRecorder.initialize(),
  };
}

export default UserplaneRecorder;
