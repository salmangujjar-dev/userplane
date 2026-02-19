/**
 * DodoPayments product metadata fetcher
 *
 * Fetches and parses feature_limits and feature_gates from Dodo product metadata.
 * Used by webhook processor to provision entitlements from the source of truth.
 */

import type {
  FeatureGate,
  PlanFeatureGates,
  ResourceLimits,
  ResourceType,
} from '@workspace/pricing';
import { FEATURE_GATE_KEYS, RESOURCE_TYPE_VALUES } from '@workspace/pricing';
import type DodoPayments from 'dodopayments';

/**
 * Short-key → full FeatureGate mapping for Dodo product metadata.
 * Dodo enforces a 500-char limit per metadata value; abbreviated keys
 * keep the JSON well under that limit while remaining human-readable.
 */
const FEATURE_GATE_SHORT_KEY_MAP: Record<string, FeatureGate> = {
  rRec: 'replayRecordings',
  blur: 'autoBlurSensitiveData',
  sess: 'requestSessions',
  scrn: 'requestScreenshots',
  ann: 'annotateScreenshots',
  file: 'requestFileUploads',
  cons: 'requestConsoleLogs',
  net: 'requestNetworkActivity',
  srvL: 'requestServerLogs',
  arpl: 'requestActionReplay',
  cWs: 'customizeWorkspace',
  seat: 'requestAdditionalSeats',
  bsR: 'bringYourOwnStorageRecordings',
  bsS: 'bringYourOwnStorageScreenshots',
  bsF: 'bringYourOwnStorageFiles',
  ret: 'customizeDataRetention',
  comp: 'enableEnterpriseCompliance',
  res: 'customizeDataResidency',
  help: 'integrateHelpDesks',
  crm: 'integrateCRMs',
  iss: 'integrateIssueTrackers',
  auto: 'integrateAutomation',
  api: 'accessUserplaneAPI',
};

/**
 * Reverse map: full FeatureGate → short key
 */
const FEATURE_GATE_FULL_TO_SHORT: Record<FeatureGate, string> = Object.fromEntries(
  Object.entries(FEATURE_GATE_SHORT_KEY_MAP).map(([short, full]) => [full, short])
) as Record<FeatureGate, string>;

/**
 * Feature limits from Dodo product metadata
 * Maps each resource type to its limit configuration
 */
export type DodoFeatureLimits = Record<ResourceType, ResourceLimits>;

/**
 * Parsed product plan metadata
 */
export interface ProductPlanMetadata {
  featureLimits: DodoFeatureLimits | null;
  featureGates: PlanFeatureGates | null;
}

/**
 * Validate that an object has the abbreviated resource limits shape { q, s, h }
 */
function isValidResourceLimits(obj: unknown): obj is { q: number; s: number; h: number } {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.q === 'number' && typeof o.s === 'number' && typeof o.h === 'number';
}

/**
 * Validate and parse feature limits from metadata.
 * Accepts abbreviated inner keys: q = quotedLimit, s = softLimit, h = hardLimit.
 */
export function parseFeatureLimits(raw: unknown): DodoFeatureLimits | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const parsed = raw as Record<string, unknown>;
  const result = {} as DodoFeatureLimits;

  for (const resourceType of RESOURCE_TYPE_VALUES) {
    const limits = parsed[resourceType];
    if (!isValidResourceLimits(limits)) return null;
    result[resourceType] = {
      quotedLimit: limits.q,
      softLimit: limits.s,
      hardLimit: limits.h,
    };
  }

  return result;
}

/**
 * Validate and parse feature gates from metadata.
 * Accepts short-keyed objects (e.g. { rRec: true, blur: false, ... })
 * and expands them to the full PlanFeatureGates shape.
 */
export function parseFeatureGates(raw: unknown): PlanFeatureGates | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const parsed = raw as Record<string, unknown>;
  const result = {} as PlanFeatureGates;

  for (const [shortKey, fullKey] of Object.entries(FEATURE_GATE_SHORT_KEY_MAP)) {
    if (typeof parsed[shortKey] !== 'boolean') return null;
    result[fullKey] = parsed[shortKey] as boolean;
  }

  // Verify every gate was populated (guards against missing keys in the map)
  for (const key of FEATURE_GATE_KEYS) {
    if (typeof result[key] !== 'boolean') return null;
  }

  return result;
}

/**
 * Decode a base64-encoded metadata value and JSON parse it.
 * Values are stored as base64(JSON.stringify(data)) to prevent
 * copy-paste corruption (spaces, line breaks) in the Dodo dashboard.
 */
export function decodeMetadataValue(raw: string): unknown {
  return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
}

/**
 * Encode feature limits into base64 metadata string.
 * Converts { quotedLimit, softLimit, hardLimit } → { q, s, h } per resource.
 */
export function encodeFeatureLimits(limits: DodoFeatureLimits): string {
  const abbreviated: Record<string, { q: number; s: number; h: number }> = {};
  for (const resourceType of RESOURCE_TYPE_VALUES) {
    const l = limits[resourceType];
    abbreviated[resourceType] = { q: l.quotedLimit, s: l.softLimit, h: l.hardLimit };
  }
  return Buffer.from(JSON.stringify(abbreviated)).toString('base64');
}

/**
 * Encode feature gates into base64 metadata string.
 * Converts full gate keys → short keys via reverse of FEATURE_GATE_SHORT_KEY_MAP.
 */
export function encodeFeatureGates(gates: PlanFeatureGates): string {
  const abbreviated: Record<string, boolean> = {};
  for (const fullKey of FEATURE_GATE_KEYS) {
    const shortKey = FEATURE_GATE_FULL_TO_SHORT[fullKey];
    if (shortKey) {
      abbreviated[shortKey] = gates[fullKey];
    }
  }
  return Buffer.from(JSON.stringify(abbreviated)).toString('base64');
}

/**
 * Fetch and parse product metadata from DodoPayments.
 *
 * Reads `feature_limits` and `feature_gates` from product metadata.
 * Values are stored as base64-encoded JSON strings in Dodo product metadata.
 *
 * @param dodoClient - DodoPayments client instance
 * @param productId - The Dodo product ID to fetch metadata for
 * @returns Parsed feature limits and gates, or null for each if missing/invalid
 */
export async function fetchProductMetadata(
  dodoClient: DodoPayments,
  productId: string
): Promise<ProductPlanMetadata> {
  const product = await dodoClient.products.retrieve(productId);
  const metadata = product.metadata as Record<string, string> | undefined;

  let featureLimits: DodoFeatureLimits | null = null;
  let featureGates: PlanFeatureGates | null = null;

  if (metadata?.feature_limits) {
    try {
      featureLimits = parseFeatureLimits(decodeMetadataValue(metadata.feature_limits));
    } catch {
      // Invalid base64 or JSON, leave as null
    }
  }

  if (metadata?.feature_gates) {
    try {
      featureGates = parseFeatureGates(decodeMetadataValue(metadata.feature_gates));
    } catch {
      // Invalid base64 or JSON, leave as null
    }
  }

  return { featureLimits, featureGates };
}
