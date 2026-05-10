# @userplane/zendesk

## Purpose

`@userplane/zendesk` packages the Userplane Zendesk app manifest, translations, and static assets into a Zendesk-uploadable zip file. It does not expose a TypeScript runtime API.

## Import Surface

- No package import surface is defined.
- The package output is `userplane.zip`, generated from files copied into `dist/`.

## Consumers

No sibling package currently depends on `@userplane/zendesk` at package level. The generated zip is consumed by the Zendesk app installation/upload workflow.

## Quick Start

Development package:

```bash
bun run --filter @userplane/zendesk package:dev
```

Production package:

```bash
bun run --filter @userplane/zendesk package
```

The packaging scripts copy `src/manifest.json`, `src/translations/`, selected assets, inject manifest environment placeholders, and zip the `dist` directory to `userplane.zip`.

## Architecture

- `src/manifest.json` is the Zendesk app manifest template.
- `src/translations/en.json` contains the app translation strings.
- `src/assets/` contains icons, logos, and screenshots copied into the package.
- `scripts/inject-manifest-env.sh` replaces `{{ZENDESK_IFRAME_URL}}` and `{{ZENDESK_DOMAIN_WHITELIST}}` in `dist/manifest.json`.
- `.env.development` and `.env.production`, when present, are read by the packaging scripts through the injection script.

## Scripts

- `bun run package`: build `userplane.zip` using `.env.production`.
- `bun run package:dev`: build `userplane.zip` using `.env.development`.

## Tests/Storybook

There is no package-local test or Storybook script. Verify by inspecting `dist/manifest.json` after packaging and uploading the generated zip through the Zendesk app workflow.

## Env/Secrets

Manifest injection uses:

- `ZENDESK_IFRAME_URL`: iframe URL used by Zendesk app locations.
- `ZENDESK_DOMAIN_WHITELIST`: domain whitelist value for the manifest.

The manifest also declares a secure hidden `jwt_secret` parameter for Zendesk installation. That value is supplied by Zendesk/app configuration, not by this packaging script.

## Change Checklist

- Keep manifest placeholders in sync with `scripts/inject-manifest-env.sh`.
- Verify all copied assets exist before changing the packaging command.
- Check screenshots and icons after asset changes.
- Inspect `dist/manifest.json` for unresolved `{{VAR}}` placeholders after packaging.
- Rebuild both dev and production packages when changing manifest structure.

## Troubleshooting

- If packaging fails before injection, check that all copied asset files exist.
- If injection fails, check that `dist/manifest.json` exists and placeholders match the script's `VARS` list.
- If Zendesk rejects the app, inspect `manifest.json` values after injection, especially iframe URL, domain whitelist, locations, and secure parameters.
- If the generated zip is stale, delete `dist` and rerun the package script.
