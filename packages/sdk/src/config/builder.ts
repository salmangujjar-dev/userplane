/**
 * Frame configuration builder
 * Provides a fluent interface for constructing frame configurations.
 */

import type { FrameConfig } from '../types';
import { DEFAULT_FRAME_CONFIG } from './defaults';

/**
 * Builder for FrameConfig.
 * Provides a fluent interface for constructing frame configurations with sensible defaults.
 */
export class FrameConfigBuilder {
  private config: Partial<FrameConfig> = { ...DEFAULT_FRAME_CONFIG };

  /** Sets the iframe URL. */
  public withUrl(url: string): this {
    this.config.url = url;
    return this;
  }

  /** Sets the overlay z-index. */
  public withZIndex(zIndex: string): this {
    this.config.zIndex = zIndex;
    return this;
  }

  /** Sets the overlay background color. */
  public withOverlayBackground(color: string): this {
    this.config.overlayBackgroundColor = color;
    return this;
  }

  /** Enables or disables backdrop blur effect. */
  public withBackdropBlur(enabled: boolean): this {
    this.config.backdropBlur = enabled;
    return this;
  }

  /** Sets the iframe sandbox permissions. */
  public withSandbox(sandbox: string): this {
    this.config.sandbox = sandbox;
    return this;
  }

  /** Sets the iframe allow permissions. */
  public withAllow(allow: string): this {
    this.config.allow = allow;
    return this;
  }

  /** Enables or disables fullscreen. */
  public withAllowFullscreen(enabled: boolean): this {
    this.config.allowFullscreen = enabled;
    return this;
  }

  /** Sets the onLoad callback. */
  public withOnLoad(callback: () => void): this {
    this.config.onLoad = callback;
    return this;
  }

  /** Sets the onError callback. */
  public withOnError(callback: () => void): this {
    this.config.onError = callback;
    return this;
  }

  /**
   * Builds and returns the final FrameConfig.
   * @throws Error if URL is not set.
   */
  public build(): FrameConfig {
    if (!this.config.url) {
      throw new Error('[FrameConfigBuilder] URL is required');
    }
    return this.config as FrameConfig;
  }
}
