/**
 * Disable zod v4's JIT schema compilation BEFORE any schema is constructed.
 *
 * Zod v4 probes for `Function` availability at runtime to enable a fast-path
 * validator generator (`util.allowsEval` in zod core). That probe calls
 * `new Function("")`, which Claude.ai's MCP App sandbox blocks under its
 * `script-src` CSP — reported as "1 blocked request · script-src eval" in
 * the Claude.ai CSP panel. The MCP Apps spec (SEP-1865) has no `unsafe-eval`
 * knob on `_meta.ui.csp`, so the only fix is on the bundle side.
 *
 * Zod ships this flag specifically for CSP-locked environments; when set,
 * the `jit && allowsEval.value` branch in `$ZodObject` short-circuits and
 * `new Function("")` is never called.
 *
 * IMPORTANT: this file has a top-level side effect. It MUST be imported as
 * the very first import in each widget's `main.tsx`, before
 * `@modelcontextprotocol/ext-apps` — whose schemas are built at module load
 * time. JavaScript hoists imports in source order, so a single
 * `import './utils/zod-jitless'` at the top of `main.tsx` is enough.
 */
import { config } from 'zod';

config({ jitless: true });
