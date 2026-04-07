import type { RoleConfig } from '@/types/roles';

import { customerSuccessConfig } from './customer-success';
import { developersConfig } from './developers';
import { supportAgentsConfig } from './support-agents';
import { supportEngineersConfig } from './support-engineers';

export const ROLE_REGISTRY: Record<string, RoleConfig> = {
  'support-agents': supportAgentsConfig,
  'support-engineers': supportEngineersConfig,
  'customer-success': customerSuccessConfig,
  developers: developersConfig,
};
