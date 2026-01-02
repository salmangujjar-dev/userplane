/**
 * Userplane SDK
 * A TypeScript SDK for CDN distribution
 */

export interface SDKConfig {
  apiKey?: string;
  endpoint?: string;
}

export class UserplaneSDK {
  private config: SDKConfig;

  constructor(config: SDKConfig = {}) {
    this.config = config;
  }

  public getConfig(): SDKConfig {
    return { ...this.config };
  }

  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  public async initialize(): Promise<void> {
    console.log('SDK initialized with config:', this.config);
  }
}

export function createSDK(config?: SDKConfig): UserplaneSDK {
  return new UserplaneSDK(config);
}

export default UserplaneSDK;
