# @workspace/contract

API contract definitions for Userplane API using oRPC.

## Overview

This package contains type-safe contract definitions for all Userplane API endpoints. It enables:

- Type-safe API client generation
- Runtime validation
- OpenAPI schema generation
- Contract-first API development

## Usage

```typescript
import { contract } from '@workspace/contract';

// Use contracts for type-safe API clients
const client = createClient(contract);
```

## Structure

- `src/schemas/` - Zod schemas for request/response validation
- `src/contract/` - oRPC contract definitions for each API domain
- `src/index.ts` - Main export with complete contract tree
