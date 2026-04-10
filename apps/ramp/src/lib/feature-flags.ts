// Feature flags for deliberately injecting failures into surfaces.
// Convention: `false` = normal/working (default), `true` = failure active.
// Works on both client and server (plain object, no React dependency).

const featureFlags = {
  // ── Client-side UI flags ──────────────────────────────────────────────

  // "New Expense" button stops opening the dialog
  newExpenseButton: false,

  // Spending trend period tabs become unresponsive
  spendingTrendTabs: false,

  // ExpensesTable throws during render → caught by ErrorBoundary
  expenseTableRender: false,

  // SpendingChart throws during render → caught by ErrorBoundary
  analyticsChartRender: false,

  // Form silently drops required fields → server returns 400
  expenseFormValidation: false,

  // Approve/reject/edit buttons silently disabled
  expenseDetailActions: false,

  // Search fires on every keystroke with no debounce
  searchDebounce: false,

  // Sign-in form shows fake "authentication service unavailable" error
  signIn: false,

  // Sign-up form shows fake "registration service unavailable" error
  signUp: false,

  // Sign-out silently fails and user stays logged in
  signOut: false,

  // Profile update shows fake "profile service unavailable" error
  profileUpdate: false,

  // Password change shows fake "password service unavailable" error
  passwordChange: false,

  // ── Server-side API flags ─────────────────────────────────────────────

  // POST /api/expenses returns 503 "temporarily unavailable"
  createExpenseSubmit: false,

  // POST /approve returns 500 "database connection lost"
  expenseApproval: false,

  // POST /reject returns 500 "transaction deadlock"
  expenseRejection: false,

  // PUT /expenses/:id returns 409 "conflict"
  expenseUpdate: false,

  // GET /expenses/:id returns 500 intermittently (50% chance)
  expenseDetailEndpoint: false,

  // GET /employees returns 503 "upstream service unavailable"
  employeesEndpoint: false,

  // GET /categories returns 500 "cache poisoned"
  categoriesEndpoint: false,

  // ── Cross-cutting API chaos flags ─────────────────────────────────────

  // Adds 2-5s delay to all API responses
  apiLatencyInjection: false,

  // ~30% of requests fail with 500
  apiIntermittentErrors: false,

  // Returns 429 after >5 requests in 10s window
  apiRateLimiting: false,

  // ~25% of responses return truncated JSON
  apiMalformedResponse: false,

  // Strips employee/category relations randomly from responses
  apiPartialData: false,

  // Returns wrong total and duplicated entries
  apiPaginationBug: false,

  // ── Client-side chaos flags ───────────────────────────────────────────

  // Client fetch randomly throws TypeError: Failed to fetch
  networkErrorSimulation: false,

  // Periodic console.error with realistic-looking messages
  consoleNoise: false,
} as const satisfies Record<string, boolean>;

export type FeatureFlag = keyof typeof featureFlags;

// ── Variant flags (string-valued) ─────────────────────────────────────

const variantFlags = {
  supportProvider: 'intercom',
} as const satisfies Record<string, string>;

export type VariantFlag = keyof typeof variantFlags;
export type SupportProvider = 'none' | 'intercom' | 'zendesk';

// ── Static defaults (immutable reference) ─────────────────────────────

export const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = { ...featureFlags };
export const VARIANT_DEFAULTS: Record<VariantFlag, string> = { ...variantFlags };

// ── Mutable runtime state ─────────────────────────────────────────────

const runtimeFlags: Record<FeatureFlag, boolean> = { ...featureFlags };
const overriddenFlags = new Set<FeatureFlag>();

const runtimeVariants: Record<VariantFlag, string> = { ...variantFlags };
const overriddenVariants = new Set<VariantFlag>();

// Check if a failure is currently active for the given flag
export function isFailureActive(flag: FeatureFlag): boolean {
  return runtimeFlags[flag];
}

// Get current value of a variant flag
export function getVariantValue(flag: VariantFlag): string {
  return runtimeVariants[flag];
}

// ── Flag metadata ─────────────────────────────────────────────────────

type FlagCategory =
  | 'Client UI'
  | 'Auth'
  | 'Server API'
  | 'Chaos (API)'
  | 'Chaos (Client)'
  | 'Integrations';

interface FlagMeta {
  category: FlagCategory;
  description: string;
  isChaos: boolean;
}

const FLAG_METADATA: Record<FeatureFlag, FlagMeta> = {
  newExpenseButton: {
    category: 'Client UI',
    description: '"New Expense" button stops opening the dialog',
    isChaos: false,
  },
  spendingTrendTabs: {
    category: 'Client UI',
    description: 'Spending trend period tabs become unresponsive',
    isChaos: false,
  },
  expenseTableRender: {
    category: 'Client UI',
    description: 'ExpensesTable throws during render, caught by ErrorBoundary',
    isChaos: false,
  },
  analyticsChartRender: {
    category: 'Client UI',
    description: 'SpendingChart throws during render, caught by ErrorBoundary',
    isChaos: false,
  },
  expenseFormValidation: {
    category: 'Client UI',
    description: 'Form silently drops required fields, causing server 400 errors',
    isChaos: false,
  },
  expenseDetailActions: {
    category: 'Client UI',
    description: 'Approve, reject, and edit buttons silently disabled',
    isChaos: false,
  },
  searchDebounce: {
    category: 'Client UI',
    description: 'Search fires on every keystroke with no debounce',
    isChaos: false,
  },
  signIn: {
    category: 'Auth',
    description: 'Sign-in form shows "authentication service unavailable" error',
    isChaos: false,
  },
  signUp: {
    category: 'Auth',
    description: 'Sign-up form shows "registration service unavailable" error',
    isChaos: false,
  },
  signOut: {
    category: 'Auth',
    description: 'Sign-out silently fails, user stays logged in',
    isChaos: false,
  },
  profileUpdate: {
    category: 'Auth',
    description: 'Profile update shows "profile service unavailable" error',
    isChaos: false,
  },
  passwordChange: {
    category: 'Auth',
    description: 'Password change shows "password service unavailable" error',
    isChaos: false,
  },
  createExpenseSubmit: {
    category: 'Server API',
    description: 'POST /api/expenses returns 503 "temporarily unavailable"',
    isChaos: false,
  },
  expenseApproval: {
    category: 'Server API',
    description: 'POST /approve returns 500 "database connection lost"',
    isChaos: false,
  },
  expenseRejection: {
    category: 'Server API',
    description: 'POST /reject returns 500 "transaction deadlock"',
    isChaos: false,
  },
  expenseUpdate: {
    category: 'Server API',
    description: 'PUT /expenses/:id returns 409 "conflict"',
    isChaos: false,
  },
  expenseDetailEndpoint: {
    category: 'Server API',
    description: 'GET /expenses/:id returns 500 intermittently (50% chance)',
    isChaos: false,
  },
  employeesEndpoint: {
    category: 'Server API',
    description: 'GET /employees returns 503 "upstream service unavailable"',
    isChaos: false,
  },
  categoriesEndpoint: {
    category: 'Server API',
    description: 'GET /categories returns 500 "cache poisoned"',
    isChaos: false,
  },
  apiLatencyInjection: {
    category: 'Chaos (API)',
    description: 'Adds 2-5s delay to all API responses',
    isChaos: true,
  },
  apiIntermittentErrors: {
    category: 'Chaos (API)',
    description: '~30% of requests fail with 500',
    isChaos: true,
  },
  apiRateLimiting: {
    category: 'Chaos (API)',
    description: 'Returns 429 after >5 requests in 10s window',
    isChaos: true,
  },
  apiMalformedResponse: {
    category: 'Chaos (API)',
    description: '~25% of responses return truncated JSON',
    isChaos: true,
  },
  apiPartialData: {
    category: 'Chaos (API)',
    description: 'Strips employee/category relations randomly',
    isChaos: true,
  },
  apiPaginationBug: {
    category: 'Chaos (API)',
    description: 'Returns wrong total and duplicated entries',
    isChaos: true,
  },
  networkErrorSimulation: {
    category: 'Chaos (Client)',
    description: 'Client fetch randomly throws TypeError: Failed to fetch',
    isChaos: true,
  },
  consoleNoise: {
    category: 'Chaos (Client)',
    description: 'Periodic console.error with realistic-looking messages',
    isChaos: true,
  },
};

// ── Variant flag metadata ─────────────────────────────────────────────

interface VariantFlagMeta {
  category: FlagCategory;
  description: string;
  allowedValues: string[];
}

const VARIANT_METADATA: Record<VariantFlag, VariantFlagMeta> = {
  supportProvider: {
    category: 'Integrations',
    description: 'Which support provider to use (or none to disable)',
    allowedValues: ['none', 'intercom', 'zendesk'],
  },
};

// ── Runtime override management ───────────────────────────────────────

export function applyOverrides(
  overrides: Partial<Record<FeatureFlag, boolean>>,
  variantOverrides?: Partial<Record<VariantFlag, string>>
): void {
  // Reset to defaults
  for (const key of Object.keys(featureFlags) as FeatureFlag[]) {
    runtimeFlags[key] = featureFlags[key];
  }
  overriddenFlags.clear();

  // Apply overrides
  for (const [key, value] of Object.entries(overrides) as [FeatureFlag, boolean][]) {
    if (key in featureFlags) {
      runtimeFlags[key] = value;
      overriddenFlags.add(key);
    }
  }

  // Reset variant flags to defaults
  for (const key of Object.keys(variantFlags) as VariantFlag[]) {
    runtimeVariants[key] = variantFlags[key];
  }
  overriddenVariants.clear();

  // Apply variant overrides
  if (variantOverrides) {
    for (const [key, value] of Object.entries(variantOverrides) as [VariantFlag, string][]) {
      if (key in variantFlags) {
        runtimeVariants[key] = value;
        overriddenVariants.add(key);
      }
    }
  }
}

export interface RuntimeFlagInfo {
  flag: FeatureFlag;
  value: boolean;
  defaultValue: boolean;
  isOverridden: boolean;
  category: FlagCategory;
  description: string;
  isChaos: boolean;
}

export function getRuntimeFlags(): RuntimeFlagInfo[] {
  return (Object.keys(featureFlags) as FeatureFlag[]).map((flag) => ({
    flag,
    value: runtimeFlags[flag],
    defaultValue: featureFlags[flag],
    isOverridden: overriddenFlags.has(flag),
    category: FLAG_METADATA[flag].category,
    description: FLAG_METADATA[flag].description,
    isChaos: FLAG_METADATA[flag].isChaos,
  }));
}

export interface RuntimeVariantInfo {
  flag: VariantFlag;
  value: string;
  defaultValue: string;
  isOverridden: boolean;
  category: FlagCategory;
  description: string;
  allowedValues: string[];
}

export function getRuntimeVariants(): RuntimeVariantInfo[] {
  return (Object.keys(variantFlags) as VariantFlag[]).map((flag) => ({
    flag,
    value: runtimeVariants[flag],
    defaultValue: variantFlags[flag],
    isOverridden: overriddenVariants.has(flag),
    category: VARIANT_METADATA[flag].category,
    description: VARIANT_METADATA[flag].description,
    allowedValues: VARIANT_METADATA[flag].allowedValues,
  }));
}

// Returns all currently active failure flags (useful for logging on app init).
export function getActiveFailureFlags(): string[] {
  return (Object.entries(runtimeFlags) as [FeatureFlag, boolean][])
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

// Convert feature flags to a flat metadata object for the Userplane SDK.
// Keys are prefixed with `flag_` to namespace them (matches YC app convention).
export function getFeatureFlagsMetadata(): Record<string, boolean | string> {
  const metadata: Record<string, boolean | string> = {};
  for (const [key, value] of Object.entries(runtimeFlags) as [string, boolean][]) {
    metadata[`flag_${key}`] = value;
  }
  for (const [key, value] of Object.entries(runtimeVariants) as [string, string][]) {
    metadata[`flag_${key}`] = value;
  }
  return metadata;
}
