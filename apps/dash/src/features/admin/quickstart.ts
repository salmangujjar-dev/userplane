import type { FeatureGate, ResourceType } from '@workspace/pricing';
import { FEATURE_GATE_KEYS, RESOURCE_TYPE_VALUES } from '@workspace/pricing';

export type AdminCustomPlanLimits = Record<
  ResourceType,
  { quotedLimit: number; actualLimit: number }
>;

export type AdminCustomPlanGates = Record<FeatureGate, boolean>;

export const ADMIN_CUSTOM_PLAN_QUICKSTART_LIMITS: AdminCustomPlanLimits = {
  seats: { quotedLimit: 30, actualLimit: 45 },
  recordings: { quotedLimit: -1, actualLimit: 700 },
  links: { quotedLimit: -1, actualLimit: 1750 },
  screenshots: { quotedLimit: -1, actualLimit: 1000 },
  files: { quotedLimit: -1, actualLimit: 4000 },
};

export const ADMIN_CUSTOM_PLAN_QUICKSTART_GATES: AdminCustomPlanGates = Object.fromEntries(
  FEATURE_GATE_KEYS.map((gate) => [gate, true])
) as AdminCustomPlanGates;

export function cloneAdminCustomPlanLimits(
  source: AdminCustomPlanLimits = ADMIN_CUSTOM_PLAN_QUICKSTART_LIMITS
): AdminCustomPlanLimits {
  const next = {} as AdminCustomPlanLimits;
  for (const resourceType of RESOURCE_TYPE_VALUES) {
    next[resourceType] = { ...source[resourceType] };
  }
  return next;
}

export function cloneAdminCustomPlanGates(
  source: AdminCustomPlanGates = ADMIN_CUSTOM_PLAN_QUICKSTART_GATES
): AdminCustomPlanGates {
  const next = {} as AdminCustomPlanGates;
  for (const gate of FEATURE_GATE_KEYS) {
    next[gate] = source[gate];
  }
  return next;
}

export function applyAdminCustomPlanQuickstart(): {
  limits: AdminCustomPlanLimits;
  gates: AdminCustomPlanGates;
} {
  return {
    limits: cloneAdminCustomPlanLimits(),
    gates: cloneAdminCustomPlanGates(),
  };
}

export function isCmdKShortcut(event: KeyboardEvent): boolean {
  return event.metaKey && event.key.toLowerCase() === 'k';
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return !!target.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
}
