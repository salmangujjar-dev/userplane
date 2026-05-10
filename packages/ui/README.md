# @userplane/ui

## Purpose

`@userplane/ui` is the shared React UI primitive package for Userplane apps. It contains Tailwind CSS globals, utility helpers, Radix-based components, icons-compatible button styles, form controls, navigation primitives, data display components, and hooks.

## Import Surface

- `@userplane/ui/globals.css`: shared Tailwind and design-token stylesheet.
- `@userplane/ui/postcss.config`: package PostCSS config.
- `@userplane/ui/lib/*`: utility modules such as `lib/utils`.
- `@userplane/ui/components/*`: component modules such as `components/button`, `components/dialog`, and `components/table`.
- `@userplane/ui/hooks/*`: hook modules such as `hooks/use-mobile`.

There is no root component barrel export; import the specific component subpath.

## Consumers

No sibling package currently depends on `@userplane/ui` at package level. It is intended for workspace apps and UI surfaces.

## Quick Start

```tsx
import '@userplane/ui/globals.css';

import { Button } from '@userplane/ui/components/button';
import { cn } from '@userplane/ui/lib/utils';

export function SaveButton() {
  return <Button className={cn('w-full')}>Save</Button>;
}
```

## Architecture

- `src/components/` contains one module per UI primitive.
- `src/hooks/` contains shared React hooks.
- `src/lib/utils.ts` contains shared class name utilities.
- `src/styles/globals.css` defines Tailwind imports, sources, theme variables, and design tokens.
- `postcss.config.mjs` exposes the PostCSS setup exported by package subpath.

Components are intended to be imported individually so apps only depend on what they use.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run lint`: run ESLint with zero warnings.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script. Verify with `typecheck`, `lint`, and consuming app UI checks.

## Env/Secrets

No environment variables or secrets are required.

## Change Checklist

- Preserve per-component subpath imports when adding components.
- Export new component files through the package `exports` glob by keeping them under `src/components`.
- Keep Tailwind `@source` paths in `globals.css` aligned with workspace app locations.
- Check peer dependency compatibility for React changes.
- Run `bun run --filter @userplane/ui typecheck` and `lint`.

## Troubleshooting

- If a component import fails, check that the file exists under `src/components` and matches the subpath.
- If styles are missing, verify the consuming app imports `@userplane/ui/globals.css`.
- If Tailwind classes are purged or absent, check `@source` paths in `globals.css`.
- If React is duplicated, verify the consuming app satisfies the React peer dependencies.
