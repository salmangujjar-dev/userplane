# @userplane/storage

## Purpose

`@userplane/storage` provides Cloudflare R2/S3-compatible storage clients for recordings, screenshots, thumbnails, logs, client actions, and media assets. It also owns the typed media asset registry and upload/validation scripts for CDN assets.

## Import Surface

- `@userplane/storage`: `getStorage`, storage client classes, asset content-type constants, storage option/config types, and `CacheControl`.
- `@userplane/storage/media`: typed access to generated media asset URLs and registry helpers.
- `@userplane/storage/assets/*`: raw asset files under `assets/`.

See [assets/README.md](./assets/README.md) for the source asset catalog, upload workflow, CDN path structure, and media-specific environment variables.

## Consumers

Package-level consumers include `@userplane/email`.

## Quick Start

```ts
import { getStorage } from '@userplane/storage';

const config = {
  cdn: {
    accountId: process.env.R2_CDN_ACCOUNT_ID!,
    accessKeyId: process.env.R2_CDN_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_CDN_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_CDN_BUCKET_NAME!,
  },
};

const video = getStorage({ kind: 'video', config });
const upload = await video.getRecordingUploadUrl('rec_123', 'video/webm', {
  contentLength: 1024,
  contentType: 'video/webm',
});
```

Media asset URLs:

```ts
import { brandUrls, integrationUrls } from '@userplane/storage/media';

const iconUrl = brandUrls.icon64();
const integrations = integrationUrls.all();
```

## Architecture

- `src/factory.ts` maps a `kind` discriminator to the correct storage client.
- `src/clients/` contains clients for assets, client actions, console logs, network logs, recordings, screenshots, and thumbnails.
- `src/base.ts` holds shared S3/R2 client behavior.
- `src/media/` contains the media registry, transform helpers, generated manifest, and public media exports.
- `assets/` is the source-of-truth static asset tree; see [assets/README.md](./assets/README.md).
- `scripts/upload-assets.ts` uploads assets and generates the content-hashed media manifest.
- `scripts/validate-manifest.ts` validates local and remote manifest consistency.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: compile in watch mode.
- `bun run typecheck`: run TypeScript without emitting output.
- `bun run lint`: run ESLint.
- `bun run upload-assets`: run `scripts/upload-assets.ts`.
- `bun run assets:upload`: upload development assets.
- `bun run assets:upload:staging`: upload staging assets.
- `bun run assets:upload:preview`: upload preview assets.
- `bun run assets:upload:production`: upload production assets.
- `bun run assets:upload:dry-run`: preview development upload.
- `bun run assets:upload:force`: force development upload.
- `bun run assets:manifest`: generate manifest only.
- `bun run validate-manifest`: run manifest validation script.
- `bun run assets:validate`: validate local and development remote assets.
- `bun run assets:validate:local`: validate local manifest.
- `bun run assets:validate:remote`: validate development remote assets.
- `bun run assets:validate:staging`: validate staging remote assets.
- `bun run assets:validate:preview`: validate preview remote assets.
- `bun run assets:validate:production`: validate production remote assets.

## Tests/Storybook

There is no package-local test or Storybook script. Use `typecheck`, `lint`, manifest validation, and a dry-run upload for asset workflow changes.

## Env/Secrets

Storage clients receive credentials through `StorageConfig`:

- `cdn`, `assets`, or `reports` bucket credentials.
- Each bucket credential contains account ID, access key ID, secret access key, and bucket name.

Asset scripts use the R2/CDN variables documented in [assets/README.md](./assets/README.md), including `R2_CDN_ACCOUNT_ID`, `R2_CDN_ACCESS_KEY_ID`, `R2_CDN_SECRET_ACCESS_KEY`, `R2_CDN_BUCKET_NAME`, `CDN_DOMAIN`, and `R2_CDN_PREFIX`.

## Change Checklist

- Keep `StorageKind`, `GetStorageOptions`, and `StorageClientMap` aligned when adding a client.
- Update `src/index.ts` exports for any new public client or type.
- Regenerate and commit `src/media/manifest.generated.ts` when source assets change.
- Run manifest validation before changing CDN asset references.
- Run `bun run --filter @userplane/storage typecheck` and `lint`.

## Troubleshooting

- If `getStorage` throws an unknown kind error, update the discriminated union and factory switch together.
- If media URLs are stale, regenerate the manifest and check CDN prefix/domain settings.
- If uploads fail, verify R2 credentials and bucket names for the selected environment.
- If consumers need raw files, import through `@userplane/storage/assets/*` only for files that exist under `assets/`.
