/**
 * Bridge Connection Manager
 * Manages the postbridge connection between SDK (host) and recorder iframe (guest)
 */

import { host, type Connection } from '@workspace/postbridge';
import type {
  HostSchema,
  GuestSchema,
  RecordingState,
  RecordingSessionInfo,
  RecordingContext,
  VerificationResult,
} from './types';
import { URL_PARAMS } from '../constants';
import { getCustomMetadata } from '@workspace/metadata';

/**
 * Callbacks for SDK events from the recorder
 */
export interface BridgeCallbacks {
  onSessionReady?: (info: RecordingSessionInfo) => void;
  onRecordingStateChange?: (state: RecordingState) => void;
  onRequestClose?: () => void;
}

/**
 * Options for creating a bridge connection
 */
export interface BridgeConnectionOptions {
  callbacks?: BridgeCallbacks;
  tabRef: string;
  verificationBaseUrl: string;
}

/**
 * Manages the postbridge connection to the recorder iframe
 */
export class BridgeConnection {
  private connection: Connection | null = null;
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
  private originalTitle: string = '';
  private tabRef: string;
  private callbacks: BridgeCallbacks;
  private verificationBaseUrl: string;

  private context: RecordingContext = {
    state: 'inactive',
    sessionInfo: null,
    tabUnloadEnabled: false,
  };

  // Session data stored directly for easy access
  private sessionId: string | null = null;
  private linkId: string | null = null;

  constructor(options: BridgeConnectionOptions) {
    this.tabRef = options.tabRef;
    this.callbacks = options.callbacks ?? {};
    this.verificationBaseUrl = options.verificationBaseUrl;
  }

  /**
   * Connect to the recorder iframe
   * @param iframe - The iframe element to connect to
   * @returns Promise that resolves when connected
   */
  public async connect(iframe: HTMLIFrameElement): Promise<void> {
    if (this.connection) {
      console.warn('[Bridge] Already connected');
      return;
    }

    console.log('[Bridge] Connecting to recorder iframe');

    // Store original title for restoration
    this.originalTitle = document.title;

    // Create host schema with methods exposed to the recorder
    const schema: HostSchema = {
      getTabRef: () => this.tabRef,
      getCustomMetadata: () => {
        try {
          return getCustomMetadata();
        } catch (error) {
          console.error('[Bridge] Error getting custom metadata:', error);
          return null;
        }
      },
      initSession: this.handleInitSession.bind(this),
      finishSession: this.handleFinishSession.bind(this),
      recordingActive: this.handleRecordingActive.bind(this),
      recordingRetained: this.handleRecordingRetained.bind(this),
      recordingInactive: this.handleRecordingInactive.bind(this),
      requestVerification: this.handleRequestVerification.bind(this),
    };

    try {
      this.connection = await host.connect(iframe, schema);
      console.log('[Bridge] Connected to recorder, connection ID:', this.connection.id);
    } catch (error) {
      console.error('[Bridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the recorder and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      console.warn('[Bridge] Not connected');
      return;
    }

    console.log('[Bridge] Disconnecting from recorder');

    // Disable tab unload protection
    this.disableTabUnloadProtection();

    // Restore original title
    if (this.originalTitle) {
      document.title = this.originalTitle;
    }

    // Close the connection
    this.connection.close();
    this.connection = null;

    // Reset context and session data
    this.context = {
      state: 'inactive',
      sessionInfo: null,
      tabUnloadEnabled: false,
    };
    this.sessionId = null;
    this.linkId = null;
  }

  /**
   * Check if connected to the recorder
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the current recording context
   */
  public getContext(): Readonly<RecordingContext> {
    return { ...this.context };
  }

  /**
   * Get the remote API to call methods on the recorder
   */
  public getRemote(): GuestSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as GuestSchema;
  }

  /**
   * Get the current session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the current link ID
   */
  public getLinkId(): string | null {
    return this.linkId;
  }

  // Host methods exposed to recorder

  /**
   * Initialize the recording session
   * Sets title, stores session info, and notifies callbacks
   */
  private handleInitSession(info: RecordingSessionInfo, title: string): void {
    console.log('[Bridge] Initializing session:', { info, title });

    // Set parent title
    document.title = title;

    // Store session info
    this.context.sessionInfo = info;
    this.sessionId = info.sessionId;
    this.linkId = info.linkId ?? null;

    // Set state to inactive (setup phase)
    this.updateState('inactive');

    // Notify callback
    this.callbacks.onSessionReady?.(info);
  }

  /**
   * Finish the recording session and cleanup
   * Resets title, clears URL params, disables protection, and closes recorder
   */
  private handleFinishSession(): void {
    console.log('[Bridge] Finishing session');

    // Reset title to original
    if (this.originalTitle) {
      document.title = this.originalTitle;
    }

    // Clear URL params so refresh doesn't re-open recorder
    const url = new URL(window.location.href);
    url.searchParams.delete(URL_PARAMS.TOKEN);
    url.searchParams.delete(URL_PARAMS.ACTION);
    url.searchParams.delete(URL_PARAMS.WORKSPACE);
    window.history.replaceState({}, '', url.toString());

    // Set state to inactive and disable protection
    this.updateState('inactive');
    this.disableTabUnloadProtection();

    // Request close (unmount iframe)
    this.callbacks.onRequestClose?.();
  }

  /**
   * Called by recorder when recording becomes active (countdown/recording)
   * Enables tab unload protection and updates state
   */
  private handleRecordingActive(): void {
    console.log('[Bridge] Recording active');
    this.updateState('active');
    this.enableTabUnloadProtection();
  }

  /**
   * Called by recorder when recording is retained (review/uploading)
   * Keeps tab unload protection enabled and updates state
   */
  private handleRecordingRetained(): void {
    console.log('[Bridge] Recording retained');
    this.updateState('retained');
    this.enableTabUnloadProtection();
  }

  /**
   * Called by recorder when recording becomes inactive (setup/success/cancelled)
   * Disables tab unload protection and updates state
   */
  private handleRecordingInactive(): void {
    console.log('[Bridge] Recording inactive');
    this.updateState('inactive');
    this.disableTabUnloadProtection();
  }

  /**
   * Handle verification request from the iframe
   * Makes the API call from the parent window so the origin header is correct
   * This is required because the API validates the origin against registered domains
   *
   * API Contract (POST /domains/verify):
   * - Request: { token: string, workspaceIds: string[] }
   * - Success: { message: string, data: { domainStatus, workspaceId, domainId, domainUrl } }
   * - Error: { code: string, message: string, status: number }
   */
  private async handleRequestVerification(
    token: string,
    workspaceIds: string[]
  ): Promise<VerificationResult> {
    console.log('[Bridge] Handling verification request');
    console.log('[Bridge] Token:', token.substring(0, 20) + '...');
    console.log('[Bridge] Workspace IDs:', workspaceIds);

    try {
      const response = await fetch(`${this.verificationBaseUrl}/domains/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, workspaceIds }),
      });

      // Parse response body - may fail if not valid JSON
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return this.parseVerificationError(json, response.status);
      }

      return this.parseVerificationSuccess(json);
    } catch (error) {
      console.error('[Bridge] Verification request error:', error);

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  /**
   * Parse successful verification response
   * Validates the response structure matches the contract
   */
  private parseVerificationSuccess(json: unknown): VerificationResult {
    // Type guard for API response structure: { message: string, data: {...} }
    if (!this.isValidApiResponse(json)) {
      console.error('[Bridge] Invalid API response structure:', json);
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response structure from API',
        },
      };
    }

    const { data } = json;

    // Extract and validate required fields from DomainVerificationDataSchema
    const domainStatus = this.extractString(data, 'domainStatus');
    const workspaceId = this.extractString(data, 'workspaceId');
    const domainId = this.extractString(data, 'domainId');
    const domainUrl = this.extractString(data, 'domainUrl');

    if (!domainStatus || !workspaceId || !domainId || !domainUrl) {
      console.error('[Bridge] Missing required fields in verification data:', data);
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Missing required fields in verification response',
        },
      };
    }

    console.log('[Bridge] Verification successful:', {
      domainStatus,
      workspaceId,
      domainId,
      domainUrl,
    });

    return {
      success: true,
      data: {
        domainStatus,
        workspaceId,
        domainId,
        domainUrl,
      },
    };
  }

  /**
   * Parse verification error response
   * Extracts error code and message from oRPC error format
   */
  private parseVerificationError(json: unknown, status: number): VerificationResult {
    // oRPC error format: { code: string, message: string, status?: number }
    const errorCode = this.extractString(json, 'code') ?? `HTTP_${status}`;
    const errorMessage = this.extractString(json, 'message') ?? `Verification failed (${status})`;

    console.error('[Bridge] Verification failed:', { errorCode, errorMessage, status });

    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
  }

  /**
   * Type guard for valid API response structure
   * Matches ApiResponseSchema: { message: string, data: object }
   */
  private isValidApiResponse(
    json: unknown
  ): json is { message: string; data: Record<string, unknown> } {
    return (
      typeof json === 'object' &&
      json !== null &&
      'message' in json &&
      typeof (json as Record<string, unknown>).message === 'string' &&
      'data' in json &&
      typeof (json as Record<string, unknown>).data === 'object' &&
      (json as Record<string, unknown>).data !== null
    );
  }

  /**
   * Safely extract a string property from an unknown object
   */
  private extractString(obj: unknown, key: string): string | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const value = (obj as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Update state and notify callback
   */
  private updateState(state: RecordingState): void {
    if (this.context.state === state) return;
    this.context.state = state;
    this.callbacks.onRecordingStateChange?.(state);
  }

  // Internal helpers

  private enableTabUnloadProtection(): void {
    if (this.context.tabUnloadEnabled) {
      return;
    }

    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      console.log('[Bridge] beforeunload triggered - preventing accidental close');
      e.preventDefault();
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.context.tabUnloadEnabled = true;
  }

  private disableTabUnloadProtection(): void {
    if (!this.context.tabUnloadEnabled) {
      return;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.context.tabUnloadEnabled = false;
  }
}
