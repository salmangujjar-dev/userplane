/**
 * Verification Bridge Connection
 * Manages the postbridge connection between SDK (host) and verification iframe (guest)
 * Focused on domain verification - handles verification API requests from the iframe
 */

import { host, type Connection } from '@workspace/postbridge';
import type { VerificationHostSchema, VerificationResult } from './types';

/**
 * Callbacks for verification events
 */
export interface VerificationBridgeCallbacks {
  onRequestClose?: () => void;
}

/**
 * Options for creating a verification bridge connection
 */
export interface VerificationBridgeConnectionOptions {
  callbacks?: VerificationBridgeCallbacks;
  verificationBaseUrl: string;
}

/**
 * Manages the postbridge connection to the verification iframe
 * Handles domain verification API requests from the iframe
 */
export class VerificationBridgeConnection {
  private connection: Connection | null = null;
  private verificationBaseUrl: string;
  private callbacks: VerificationBridgeCallbacks;

  constructor(options: VerificationBridgeConnectionOptions) {
    this.verificationBaseUrl = options.verificationBaseUrl;
    this.callbacks = options.callbacks ?? {};
  }

  /**
   * Connect to the verification iframe
   * @param iframe - The iframe element to connect to
   * @returns Promise that resolves when connected
   */
  public async connect(iframe: HTMLIFrameElement): Promise<void> {
    if (this.connection) {
      console.warn('[VerificationBridge] Already connected');
      return;
    }

    console.log('[VerificationBridge] Connecting to verification iframe');

    // Create host schema with verification methods
    const schema: VerificationHostSchema = {
      requestVerification: this.handleRequestVerification.bind(this),
    };

    try {
      this.connection = await host.connect(iframe, schema);
      console.log(
        '[VerificationBridge] Connected to verification iframe, connection ID:',
        this.connection.id
      );
    } catch (error) {
      console.error('[VerificationBridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the verification iframe and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      console.warn('[VerificationBridge] Not connected');
      return;
    }

    console.log('[VerificationBridge] Disconnecting from verification iframe');
    this.connection.close();
    this.connection = null;
  }

  /**
   * Check if connected to the verification iframe
   */
  public isConnected(): boolean {
    return this.connection !== null;
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
    console.log('[VerificationBridge] Handling verification request');
    console.log('[VerificationBridge] Token:', token.substring(0, 20) + '...');
    console.log('[VerificationBridge] Workspace IDs:', workspaceIds);

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
      console.error('[VerificationBridge] Verification request error:', error);

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
      console.error('[VerificationBridge] Invalid API response structure:', json);
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
      console.error('[VerificationBridge] Missing required fields in verification data:', data);
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Missing required fields in verification response',
        },
      };
    }

    console.log('[VerificationBridge] Verification successful:', {
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

    console.error('[VerificationBridge] Verification failed:', { errorCode, errorMessage, status });

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
}
