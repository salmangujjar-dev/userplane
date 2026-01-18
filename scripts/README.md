# Scripts

This directory contains utility scripts for maintaining and validating the monorepo.

## Environment Variables Validation

### check-env-vars.js

Validates that all environment variables used across the codebase are properly declared in `turbo.json`.

**What it does:**

- Scans all apps for environment variable usage (`process.env.*` and `import.meta.env.*`)
- Compares found variables with declarations in `turbo.json`
- Validates `.env.example` files
- Reports missing or unused declarations

**Usage:**

```bash
bun run check:env
```

**Output:**

- Lists all environment variables per app
- Shows which variables are used in code vs declared in `.env.example`
- Reports any missing declarations in `turbo.json`
- Warns about unused declarations
- Exits with error code 1 if critical issues are found

**Why this matters:**

Turborepo needs to know about environment variables to properly invalidate cache when they change. If a variable is used but not declared in `turbo.json`, builds might use stale cached results even when the environment variable changes.

**When to run:**

- Before committing changes that add new environment variables
- As part of CI/CD pipeline
- When troubleshooting cache invalidation issues
- Periodically to ensure configuration stays in sync

**Example output:**

```
Environment Variables Validation
================================================================================

Turbo.json declares 69 environment variables

Scanning api (node)...
  - Found 63 env vars in code
  - Found 61 env vars in .env.example

[... detailed reports ...]

✓ All environment variables are properly declared in turbo.json
```

## Adding New Scripts

When adding new scripts to this directory:

1. Use Node.js for maximum compatibility
2. Add shebang line: `#!/usr/bin/env node`
3. Make executable: `chmod +x scripts/your-script.js`
4. Add to `package.json` scripts section
5. Document in this README
6. Follow existing patterns for error handling and output formatting
