// Feature flags for deliberately gating or breaking surfaces.
// Convention: `true` = normal/working, `false` = failure active.
// Chaos flags (opt-in failures) use the reverse: `false` = off, `true` = active.
// Works on both client and server (plain object, no React dependency).

const featureFlags = {
  // ── Client-side UI flags ──────────────────────────────────────────────

  // Controls whether the "New Expense" button opens the dialog
  newExpenseButton: true,

  // Controls whether the spending trend period tabs are switchable
  spendingTrendTabs: true,

  // When false, ExpensesTable throws during render → caught by ErrorBoundary
  expenseTableRender: true,

  // When false, SpendingChart throws during render → caught by ErrorBoundary
  analyticsChartRender: true,

  // When false, form silently drops required fields → server returns 400
  expenseFormValidation: true,

  // When false, approve/reject/edit buttons silently disabled
  expenseDetailActions: true,

  // When false, search fires on every keystroke with no debounce
  searchDebounce: true,

  // When false, sign-in form shows fake "authentication service unavailable" error
  signIn: true,

  // When false, sign-up form shows fake "registration service unavailable" error
  signUp: true,

  // When false, sign-out silently fails and user stays logged in
  signOut: true,

  // When false, profile update shows fake "profile service unavailable" error
  profileUpdate: true,

  // When false, password change shows fake "password service unavailable" error
  passwordChange: true,

  // ── Server-side API flags ─────────────────────────────────────────────

  // POST /api/expenses → 503 "temporarily unavailable"
  createExpenseSubmit: true,

  // POST /approve → 500 "database connection lost"
  expenseApproval: true,

  // POST /reject → 500 "transaction deadlock"
  expenseRejection: true,

  // PUT /expenses/:id → 409 "conflict"
  expenseUpdate: true,

  // GET /expenses/:id → 500 intermittently (50% chance)
  expenseDetailEndpoint: true,

  // GET /employees → 503 "upstream service unavailable"
  employeesEndpoint: true,

  // GET /categories → 500 "cache poisoned"
  categoriesEndpoint: true,

  // ── Cross-cutting API chaos flags (opt-in, default off) ───────────────

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

  // ── Client-side chaos flags (opt-in, default off) ─────────────────────

  // Client fetch randomly throws TypeError: Failed to fetch
  networkErrorSimulation: false,

  // Periodic console.error with realistic-looking messages
  consoleNoise: false,
} as const satisfies Record<string, boolean>;

export type FeatureFlag = keyof typeof featureFlags;

// ── Static defaults (immutable reference) ─────────────────────────────

export const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = { ...featureFlags };

// ── Mutable runtime state ─────────────────────────────────────────────

const runtimeFlags: Record<FeatureFlag, boolean> = { ...featureFlags };
const overriddenFlags = new Set<FeatureFlag>();

// Check if a feature is enabled
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return runtimeFlags[flag];
}

// ── Flag metadata ─────────────────────────────────────────────────────

type FlagCategory = 'Client UI' | 'Auth' | 'Server API' | 'Chaos (API)' | 'Chaos (Client)';

interface FlagMeta {
  category: FlagCategory;
  description: string;
  isChaos: boolean;
}

const FLAG_METADATA: Record<FeatureFlag, FlagMeta> = {
  newExpenseButton: {
    category: 'Client UI',
    description: 'Controls whether the "New Expense" button opens the dialog',
    isChaos: false,
  },
  spendingTrendTabs: {
    category: 'Client UI',
    description: 'Controls whether the spending trend period tabs are switchable',
    isChaos: false,
  },
  expenseTableRender: {
    category: 'Client UI',
    description: 'When off, ExpensesTable throws during render',
    isChaos: false,
  },
  analyticsChartRender: {
    category: 'Client UI',
    description: 'When off, SpendingChart throws during render',
    isChaos: false,
  },
  expenseFormValidation: {
    category: 'Client UI',
    description: 'When off, form silently drops required fields',
    isChaos: false,
  },
  expenseDetailActions: {
    category: 'Client UI',
    description: 'When off, approve/reject/edit buttons are disabled',
    isChaos: false,
  },
  searchDebounce: {
    category: 'Client UI',
    description: 'When off, search fires on every keystroke with no debounce',
    isChaos: false,
  },
  signIn: {
    category: 'Auth',
    description: 'When off, sign-in shows "authentication service unavailable"',
    isChaos: false,
  },
  signUp: {
    category: 'Auth',
    description: 'When off, sign-up shows "registration service unavailable"',
    isChaos: false,
  },
  signOut: { category: 'Auth', description: 'When off, sign-out silently fails', isChaos: false },
  profileUpdate: {
    category: 'Auth',
    description: 'When off, profile update shows "profile service unavailable"',
    isChaos: false,
  },
  passwordChange: {
    category: 'Auth',
    description: 'When off, password change shows "password service unavailable"',
    isChaos: false,
  },
  createExpenseSubmit: {
    category: 'Server API',
    description: 'POST /api/expenses → 503 "temporarily unavailable"',
    isChaos: false,
  },
  expenseApproval: {
    category: 'Server API',
    description: 'POST /approve → 500 "database connection lost"',
    isChaos: false,
  },
  expenseRejection: {
    category: 'Server API',
    description: 'POST /reject → 500 "transaction deadlock"',
    isChaos: false,
  },
  expenseUpdate: {
    category: 'Server API',
    description: 'PUT /expenses/:id → 409 "conflict"',
    isChaos: false,
  },
  expenseDetailEndpoint: {
    category: 'Server API',
    description: 'GET /expenses/:id → 500 intermittently (50%)',
    isChaos: false,
  },
  employeesEndpoint: {
    category: 'Server API',
    description: 'GET /employees → 503 "upstream service unavailable"',
    isChaos: false,
  },
  categoriesEndpoint: {
    category: 'Server API',
    description: 'GET /categories → 500 "cache poisoned"',
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

// ── Runtime override management ───────────────────────────────────────

export function applyOverrides(overrides: Partial<Record<FeatureFlag, boolean>>): void {
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

// Returns all currently active failure flags (useful for logging on app init).
// "Active" means: standard flags set to `false` (failure on) or chaos flags set to `true` (chaos on).
export function getActiveFailureFlags(): string[] {
  const chaosFlags: FeatureFlag[] = [
    'apiLatencyInjection',
    'apiIntermittentErrors',
    'apiRateLimiting',
    'apiMalformedResponse',
    'apiPartialData',
    'apiPaginationBug',
    'networkErrorSimulation',
    'consoleNoise',
  ];

  return (Object.entries(runtimeFlags) as [FeatureFlag, boolean][])
    .filter(([key, value]) => {
      if (chaosFlags.includes(key)) {
        return value === true; // chaos flag active when true
      }
      return value === false; // standard flag active (failing) when false
    })
    .map(([key]) => key);
}

// Convert feature flags to a flat metadata object for the Userplane SDK.
// Keys are prefixed with `flag_` to namespace them (matches YC app convention).
export function getFeatureFlagsMetadata(): Record<string, boolean> {
  const metadata: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(runtimeFlags) as [string, boolean][]) {
    metadata[`flag_${key}`] = value;
  }
  return metadata;
}
