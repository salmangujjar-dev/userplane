/**
 * Verification Bridge Connection
 * Manages the postbridge connection for domain verification flow
 * Focused solely on verification - no recording state management
 */

import { type Connection, guest } from '@workspace/postbridge';

import { classifyVerificationApiError, createVerificationError } from '@/lib/verification-errors';
import type { VerificationError } from '@/types/errors';

import type { ParentVerificationResult, VerificationData, VerificationHostSchema } from './types';

/**
 * Verification result returned to app code (with VerificationError)
 */
export interface VerificationResult {
  success: boolean;
  data?: VerificationData;
  error?: VerificationError;
}

/**
 * Guest schema exposed by verification bridge to parent
 * Minimal - verification doesn't need to expose state to parent
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VerificationGuestSchema {
  // No methods needed - verification is a one-way request
}

/**
 * Manages the postbridge connection for domain verification
 * Lightweight connection focused only on verification requests
 */
export class VerificationBridgeConnection {
  private connection: Connection | null = null;

  /**
   * Connect to the parent SDK
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<void> {
    if (this.connection) {
      console.warn('[VerificationBridge] Already connected');
      return;
    }

    console.log('[VerificationBridge] Connecting to parent SDK');

    // Minimal guest schema - verification doesn't expose methods to parent
    const schema: VerificationGuestSchema = {};

    try {
      this.connection = await guest.connect(schema);
      console.log('[VerificationBridge] Connected to parent, connection ID:', this.connection.id);
    } catch (error) {
      console.error('[VerificationBridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the parent and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      console.warn('[VerificationBridge] Not connected');
      return;
    }

    console.log('[VerificationBridge] Disconnecting from parent');
    this.connection.close();
    this.connection = null;
  }

  /**
   * Check if connected to the parent
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the remote API to call verification methods on the parent
   */
  private getRemote(): VerificationHostSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as VerificationHostSchema;
  }

  /**
   * Request domain verification from the parent SDK
   * The parent makes the API call so the request origin is the parent's domain
   * This is required because the API validates the origin against registered domains
   *
   * @param token - Verification JWT token
   * @param workspaceIds - Workspace IDs from the SDK/meta tags
   * @returns Verification result with success/error status
   */
  public async requestVerification(
    token: string,
    workspaceIds: string[]
  ): Promise<VerificationResult> {
    const remote = this.getRemote();
    if (!remote) {
      console.log('[VerificationBridge] Not connected, cannot request verification');
      return {
        success: false,
        error: createVerificationError('VERIFICATION_BRIDGE_NOT_CONNECTED'),
      };
    }

    try {
      console.log('[VerificationBridge] Requesting verification from parent');
      const result: ParentVerificationResult = await remote.requestVerification(
        token,
        workspaceIds
      );
      console.log('[VerificationBridge] Verification result from parent:', result);

      // Map raw API error to VerificationError
      if (!result.success && result.error) {
        return {
          success: false,
          error: classifyVerificationApiError(result.error.code),
        };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('[VerificationBridge] Failed to request verification:', error);
      return {
        success: false,
        error: createVerificationError('VERIFICATION_BRIDGE_COMMUNICATION_ERROR'),
      };
    }
  }

  /**
   * Request the parent SDK to close the verification iframe
   * Called when verification is complete (success or user wants to close)
   */
  public requestClose(): void {
    const remote = this.getRemote();
    if (!remote) {
      console.log('[VerificationBridge] Not connected, cannot request close');
      return;
    }

    console.log('[VerificationBridge] Requesting close from parent');
    remote.requestClose();
  }
}

/**
 * Singleton instance of the verification bridge connection
 */
let verificationBridgeInstance: VerificationBridgeConnection | null = null;

/**
 * Get or create the verification bridge instance
 */
export function getVerificationBridge(): VerificationBridgeConnection {
  if (!verificationBridgeInstance) {
    verificationBridgeInstance = new VerificationBridgeConnection();
  }
  return verificationBridgeInstance;
}

/**
 * Reset the verification bridge instance (for testing)
 */
export function resetVerificationBridge(): void {
  if (verificationBridgeInstance) {
    verificationBridgeInstance.disconnect();
    verificationBridgeInstance = null;
  }
}
