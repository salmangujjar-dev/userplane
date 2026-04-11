/**
 * Generates a static OpenAPI specification from the public API contract.
 * Output: apps/docs/openapi.json
 *
 * Usage: bun run scripts/generate-openapi.ts
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ConditionalSchemaConverter } from '@orpc/openapi';
import { OpenAPIGenerator } from '@orpc/openapi';
import { z } from 'zod';

import { publicApiContract } from '../src/public/index';

/**
 * Schema converter for Zod 4.
 *
 * `@orpc/zod`'s built-in `ZodToJsonSchemaConverter` targets Zod 3 and rejects
 * Zod 4 schemas (`"_zod" in schema` → condition returns false). This converter
 * bridges the gap by delegating to Zod 4's native `z.toJSONSchema()`.
 */
class Zod4ToJsonSchemaConverter implements ConditionalSchemaConverter {
  condition(schema: unknown): boolean {
    return schema != null && typeof schema === 'object' && '_zod' in schema;
  }

  convert(schema: unknown): [required: boolean, jsonSchema: Record<string, unknown> | boolean] {
    if (schema == null) return [false, true];

    const zodSchema = schema as z.ZodType;
    const jsonSchema = z.toJSONSchema(zodSchema, {
      target: 'openApi3.1',
      unrepresentable: 'any',
    });

    const isOptional =
      typeof zodSchema === 'object' &&
      '_zod' in zodSchema &&
      (zodSchema._zod as { def: { type: string } }).def.type === 'optional';

    return [!isOptional, jsonSchema];
  }
}

const generator = new OpenAPIGenerator({
  schemaConverters: [new Zod4ToJsonSchemaConverter()],
});

const spec = await generator.generate(publicApiContract, {
  info: {
    title: 'Userplane Public API',
    version: '1.0.0',
    description:
      'Programmatic access to Userplane workspaces, recordings, and links. Authenticate with a Bearer token using your API key (uspl_ prefix).',
  },
  servers: [
    {
      url: 'https://api.userplane.io/api/v1',
      description: 'Production',
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description:
          'API key with uspl_ prefix. Create keys at dash.userplane.io/_/account?tab=developers',
      },
    },
  },
});

// Normalize tags: strip "Public API - " prefix
if (spec.paths) {
  for (const pathItem of Object.values(spec.paths)) {
    if (!pathItem) continue;
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = pathItem[method];
      if (operation?.tags) {
        operation.tags = operation.tags.map((tag) => tag.replace(/^Public API - /, ''));
      }
    }
  }
}

if (spec.tags) {
  spec.tags = spec.tags.map((tag) => ({
    ...tag,
    name: tag.name.replace(/^Public API - /, ''),
  }));
}

const outPath = resolve(import.meta.dirname, '../../../apps/docs/openapi.json');
writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');

console.log(`OpenAPI spec written to ${outPath}`);
console.log(`  Paths: ${Object.keys(spec.paths ?? {}).length}`);
console.log(`  Tags: ${(spec.tags ?? []).map((t) => t.name).join(', ')}`);
