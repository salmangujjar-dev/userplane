/**
 * Verification Frame Manager
 * Manages the verification iframe for domain verification flow
 */

import { VerificationBridgeConnection } from '../bridge';
import { BaseFrameManager } from './base-manager';
import type { IVerificationFrameManager, VerificationFrameManagerConfig } from './types';

/**
 * Frame manager for domain verification
 * Lightweight manager focused on verification API integration
 */
export class VerificationFrameManager
  extends BaseFrameManager
  implements IVerificationFrameManager
{
  private bridge: VerificationBridgeConnection | null = null;
  private verificationConfig: VerificationFrameManagerConfig;

  constructor(config: VerificationFrameManagerConfig) {
    super(config);
    this.verificationConfig = config;
  }

  protected getManagerName(): string {
    return 'VerificationFrameManager';
  }

  public isBridgeConnected(): boolean {
    return this.bridge?.isConnected() ?? false;
  }

  protected establishBridge(): void {
    if (!this.frame) {
      this.logger.error('No frame to connect bridge to');
      return;
    }

    this.logger.debug('Establishing verification bridge');

    this.bridge = new VerificationBridgeConnection({
      verificationBaseUrl: this.verificationConfig.verificationBaseUrl,
      tabRef: this.verificationConfig.tabRef,
      callbacks: {
        onRequestClose: () => this.handleCloseRequest(),
      },
    });

    this.bridge.connect(this.frame.iframe).catch((error) => {
      this.logger.error({ err: error }, 'Bridge connection failed');
    });
  }

  protected disconnectBridge(): void {
    if (this.bridge) {
      this.bridge.disconnect();
      this.bridge = null;
      this.logger.debug('Bridge disconnected');
    }
  }
}
