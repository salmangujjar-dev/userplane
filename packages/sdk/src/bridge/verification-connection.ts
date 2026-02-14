/**
 * Verification Bridge Connection
 * Manages the postbridge connection between SDK (host) and verification iframe (guest)
 * Focused on domain verification - handles verification API requests from the iframe
 */

import { type Connection, host } from '@workspace/postbridge';

import { CONNECTION_PREFIXES, generateConnectionId } from '../constants';
import { createSdkLogger } from '../logger';
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
  /** Tab reference for connection ID generation */
  tabRef: string;
}

/**
 * Manages the postbridge connection to the verification iframe
 * Handles domain verification API requests from the iframe
 */
export class VerificationBridgeConnection {
  private connection: Connection | null = null;
  private verificationBaseUrl: string;
  private callbacks: VerificationBridgeCallbacks;
  private tabRef: string;
  private connectionId: string;
  private logger = createSdkLogger('VerificationBridge');

  constructor(options: VerificationBridgeConnectionOptions) {
    this.verificationBaseUrl = options.verificationBaseUrl;
    this.callbacks = options.callbacks ?? {};
    this.tabRef = options.tabRef;
    // Generate prefixed connection ID: vrd_{tabRef}
    this.connectionId = generateConnectionId(CONNECTION_PREFIXES.VERIFICATION, this.tabRef);
  }

  /**
   * Get the prefixed connection ID for this verification
   * Format: vrd_{tabRef}
   */
  public getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * Connect to the verification iframe
   * @param iframe - The iframe element to connect to
   * @returns Promise that resolves when connected
   */
  public async connect(iframe: HTMLIFrameElement): Promise<void> {
    if (this.connection) {
      this.logger.debug('Already connected');
      return;
    }

    this.logger.debug('Connecting to verification iframe');

    // Create host schema with verification methods
    const schema: VerificationHostSchema = {
      requestVerification: this.handleRequestVerification.bind(this),
      requestClose: this.handleRequestClose.bind(this),
    };

    try {
      this.connection = await host.connect(iframe, schema);
      this.logger.debug({ connectionId: this.connection.id }, 'Connected to verification iframe');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to connect');
      throw error;
    }
  }

  /**
   * Disconnect from the verification iframe and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      this.logger.debug('Not connected');
      return;
    }

    this.logger.debug('Disconnecting from verification iframe');
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
   * Handle close request from the iframe
   * Called when verification is complete and the iframe should be closed
   */
  private handleRequestClose(): void {
    this.logger.debug('Close requested from iframe');
    this.callbacks.onRequestClose?.();
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
    this.logger.debug('Handling verification request');
    this.logger.debug({ token: token.substring(0, 20) + '...' }, 'Verification token');
    this.logger.debug({ workspaceIds }, 'Verification workspace IDs');

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
      this.logger.error({ err: error }, 'Verification request error');

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
      this.logger.error('Invalid API response structure');
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
      this.logger.error('Missing required fields in verification data');
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Missing required fields in verification response',
        },
      };
    }

    this.logger.debug(
      { domainStatus, workspaceId, domainId, domainUrl },
      'Verification successful'
    );

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

    this.logger.error({ errorCode, errorMessage, status }, 'Verification failed');

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
