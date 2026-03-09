/**
 * DodoPayments product metadata fetcher
 *
 * Reads and writes feature limits and feature gates as flat metadata keys on Dodo products.
 * DodoPayments supports up to 25 metadata keys (≤40 chars each), so we use one key per
 * field — no base64 encoding or abbreviated keys required.
 */

import type {
  BillingCadence,
  FeatureGate,
  PlanFeatureGates,
  ResourceLimits,
  ResourceType,
} from '@userplane/pricing';
import { FEATURE_GATE_KEYS, RESOURCE_TYPE_VALUES } from '@userplane/pricing';
import type DodoPayments from 'dodopayments';

/**
 * Feature limits from Dodo product metadata
 * Maps each resource type to its limit configuration
 */
export type DodoFeatureLimits = Record<ResourceType, ResourceLimits>;

/**
 * Metadata key for billing cadence
 */
export const BILLING_CADENCE_METADATA_KEY = 'billing_cadence';

/**
 * Parsed product plan metadata
 */
export interface ProductPlanMetadata {
  featureLimits: DodoFeatureLimits | null;
  featureGates: PlanFeatureGates | null;
  billingCadence: BillingCadence | null;
}

/**
 * Maps each ResourceType to its flat metadata key names.
 * `as const satisfies` preserves literal types on the values while enforcing
 * that every ResourceType is covered.
 */
export const LIMIT_METADATA_KEYS = {
  seats: { quoted: 'seats_quoted_limit', actual: 'seats_actual_limit' },
  recordings: { quoted: 'recordings_quoted_limit', actual: 'recordings_actual_limit' },
  links: { quoted: 'links_quoted_limit', actual: 'links_actual_limit' },
  screenshots: { quoted: 'screenshots_quoted_limit', actual: 'screenshots_actual_limit' },
  files: { quoted: 'files_quoted_limit', actual: 'files_actual_limit' },
} as const satisfies Record<ResourceType, { quoted: string; actual: string }>;

/**
 * Maps each FeatureGate to its flat metadata key name.
 * `as const satisfies` preserves literal types on the values while enforcing
 * that every FeatureGate is covered.
 */
export const GATE_METADATA_KEYS = {
  requestRecordings: 'request_recordings_enabled',
  requestSessions: 'request_sessions_enabled',
  requestScreenshots: 'request_screenshots_enabled',
  requestFiles: 'request_files_enabled',
  redactSensitiveData: 'redact_sensitive_data_enabled',
  captureConsoleLog: 'capture_console_log_enabled',
  captureNetworkActivity: 'capture_network_activity_enabled',
  captureUserActions: 'capture_user_actions_enabled',
  captureServerLogs: 'capture_server_logs_enabled',
  customizeRecordingLink: 'customize_recording_link_enabled',
  customizeRetentionPolicy: 'customize_retention_policy_enabled',
  sendOutboundEmails: 'send_outbound_emails_enabled',
  samlSso: 'saml_sso_enabled',
} as const satisfies Record<FeatureGate, string>;

/**
 * Build a flat metadata object ready to pass as Dodo product `metadata`.
 * Produces one key per limit field and one key per feature gate.
 * Values are all strings: numeric strings for limits, "true"/"false" for gates.
 */
export function buildFlatMetadata(
  limits: DodoFeatureLimits,
  gates: PlanFeatureGates,
  billingCadence?: BillingCadence | null
): Record<string, string> {
  const metadata: Record<string, string> = {};

  for (const resourceType of RESOURCE_TYPE_VALUES) {
    const { quoted, actual } = LIMIT_METADATA_KEYS[resourceType];
    const l = limits[resourceType];
    metadata[quoted] = String(l.quotedLimit);
    metadata[actual] = String(l.actualLimit);
  }

  for (const gate of FEATURE_GATE_KEYS) {
    metadata[GATE_METADATA_KEYS[gate]] = String(gates[gate]);
  }

  if (billingCadence) {
    metadata[BILLING_CADENCE_METADATA_KEY] = billingCadence;
  }

  return metadata;
}

/**
 * Parse a flat Dodo product metadata object into typed feature limits and gates.
 * Accepts `Record<string, unknown>` to avoid an unsafe cast at every call site —
 * Dodo's SDK types metadata as `object` and the actual value types are unverified.
 * Returns null for each section if any expected key is missing or malformed.
 */
export function parseFlatMetadata(metadata: Record<string, unknown>): ProductPlanMetadata {
  // --- Feature limits ---
  // Build entries one at a time; bail out early on the first malformed key.
  const limitEntries: [ResourceType, ResourceLimits][] = [];

  for (const resourceType of RESOURCE_TYPE_VALUES) {
    const { quoted, actual } = LIMIT_METADATA_KEYS[resourceType];
    const q = Number(metadata[quoted]);
    const a = Number(metadata[actual]);
    if (!Number.isFinite(q) || !Number.isFinite(a)) {
      break;
    }
    limitEntries.push([resourceType, { quotedLimit: q, actualLimit: a }]);
  }

  // All resource types must be present for the section to be valid.
  const featureLimits: DodoFeatureLimits | null =
    limitEntries.length === RESOURCE_TYPE_VALUES.length
      ? (Object.fromEntries(limitEntries) as DodoFeatureLimits)
      : null;

  // --- Feature gates ---
  const gateEntries: [FeatureGate, boolean][] = [];

  for (const gate of FEATURE_GATE_KEYS) {
    const raw = metadata[GATE_METADATA_KEYS[gate]];
    if (raw !== 'true' && raw !== 'false') {
      break;
    }
    gateEntries.push([gate, raw === 'true']);
  }

  // All gates must be present for the section to be valid.
  const featureGates: PlanFeatureGates | null =
    gateEntries.length === FEATURE_GATE_KEYS.length
      ? (Object.fromEntries(gateEntries) as PlanFeatureGates)
      : null;

  // --- Billing cadence ---
  const rawCadence = metadata[BILLING_CADENCE_METADATA_KEY];
  const billingCadence: BillingCadence | null =
    rawCadence === 'monthly' || rawCadence === 'annual' ? rawCadence : null;

  return { featureLimits, featureGates, billingCadence };
}

/**
 * Merge partial admin overrides with full product defaults into a complete
 * flat metadata object ready for a DodoPayments subscription metadata update.
 *
 * Only overridden keys are written — missing keys inherit from the product defaults.
 * Both gates and limits must be fully populated after the merge (the existing
 * `buildFlatMetadata` handles that), so callers must supply complete defaults.
 */
export function mergeAndBuildFlatMetadata(
  defaults: { featureLimits: DodoFeatureLimits; featureGates: PlanFeatureGates },
  overrides: {
    featureGates?: Partial<PlanFeatureGates>;
    featureLimits?: Partial<Record<ResourceType, Partial<ResourceLimits>>>;
  },
  billingCadence?: BillingCadence | null
): Record<string, string> {
  // Merge gates
  const mergedGates: PlanFeatureGates = { ...defaults.featureGates };
  if (overrides.featureGates) {
    for (const gate of FEATURE_GATE_KEYS) {
      if (gate in overrides.featureGates) {
        mergedGates[gate] = overrides.featureGates[gate]!;
      }
    }
  }

  // Merge limits
  const mergedLimits: DodoFeatureLimits = { ...defaults.featureLimits };
  if (overrides.featureLimits) {
    for (const resourceType of RESOURCE_TYPE_VALUES) {
      const override = overrides.featureLimits[resourceType];
      if (override) {
        mergedLimits[resourceType] = {
          quotedLimit: override.quotedLimit ?? defaults.featureLimits[resourceType].quotedLimit,
          actualLimit: override.actualLimit ?? defaults.featureLimits[resourceType].actualLimit,
        };
      }
    }
  }

  return buildFlatMetadata(mergedLimits, mergedGates, billingCadence);
}

/**
 * Fetch and parse product metadata from DodoPayments.
 *
 * Reads flat metadata keys (one per limit field, one per feature gate) from the
 * Dodo product and returns typed feature limits and gates.
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
  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  return parseFlatMetadata(metadata);
}
