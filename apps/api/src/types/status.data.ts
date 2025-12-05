/**
 * Status API Data Types
 * Data types for status/health API responses
 */

export interface ApiInfoData {
  version: string;
  name: string;
  description: string;
  endpoints: {
    health: string;
    api: string;
  };
}

export interface HealthData {
  status: string;
  timestamp: string;
  version: string;
}
