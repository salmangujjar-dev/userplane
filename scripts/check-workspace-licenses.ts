import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

type License = 'Apache-2.0' | 'FSL-1.1-ALv2';

const ROOT = process.cwd();

const WORKSPACE_LICENSES: Record<string, License> = {
  'apps/api': 'FSL-1.1-ALv2',
  'apps/dash': 'FSL-1.1-ALv2',
  'apps/docs': 'Apache-2.0',
  'apps/extension': 'FSL-1.1-ALv2',
  'apps/home': 'FSL-1.1-ALv2',
  'apps/ramp': 'FSL-1.1-ALv2',
  'apps/raycast': 'Apache-2.0',
  'apps/recorder': 'FSL-1.1-ALv2',
  'packages/auth': 'FSL-1.1-ALv2',
  'packages/blurr': 'FSL-1.1-ALv2',
  'packages/cache': 'FSL-1.1-ALv2',
  'packages/client': 'FSL-1.1-ALv2',
  'packages/common-logger': 'Apache-2.0',
  'packages/console-logger': 'Apache-2.0',
  'packages/contract': 'FSL-1.1-ALv2',
  'packages/db': 'FSL-1.1-ALv2',
  'packages/email': 'FSL-1.1-ALv2',
  'packages/embed': 'FSL-1.1-ALv2',
  'packages/eslint-config': 'Apache-2.0',
  'packages/logger': 'FSL-1.1-ALv2',
  'packages/mcp-apps': 'FSL-1.1-ALv2',
  'packages/metadata': 'FSL-1.1-ALv2',
  'packages/payments': 'FSL-1.1-ALv2',
  'packages/postbridge': 'FSL-1.1-ALv2',
  'packages/pricing': 'FSL-1.1-ALv2',
  'packages/sdk': 'FSL-1.1-ALv2',
  'packages/shared': 'Apache-2.0',
  'packages/storage': 'FSL-1.1-ALv2',
  'packages/typescript-config': 'Apache-2.0',
  'packages/ui': 'Apache-2.0',
  'packages/zendesk': 'FSL-1.1-ALv2',
};

function readText(filePath: string): string {
  return readFileSync(path.join(ROOT, filePath), 'utf8');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readText(filePath)) as T;
}

function listWorkspaces(): string[] {
  const workspaces: string[] = [];

  for (const rootDir of ['apps', 'packages']) {
    for (const entry of readdirSync(path.join(ROOT, rootDir), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const workspace = `${rootDir}/${entry.name}`;
      if (existsSync(path.join(ROOT, workspace, 'package.json'))) {
        workspaces.push(workspace);
      }
    }
  }

  return workspaces.sort();
}

function fail(errors: string[]): never {
  console.error(
    `License check failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const errors: string[] = [];
const workspaces = listWorkspaces();

const rootPackage = readJson<{ license?: string }>('package.json');
if (rootPackage.license !== 'Apache-2.0') {
  errors.push(
    `package.json license must be Apache-2.0, found ${rootPackage.license ?? '(missing)'}`
  );
}

const rootLicense = readText('LICENSE');
if (!rootLicense.includes('Apache License') || !rootLicense.includes('Version 2.0, January 2004')) {
  errors.push('root LICENSE must contain the Apache License, Version 2.0 text');
}

if (!existsSync(path.join(ROOT, 'LICENSES/FSL-1.1-ALv2.md'))) {
  errors.push('LICENSES/FSL-1.1-ALv2.md is missing');
} else if (
  !readText('LICENSES/FSL-1.1-ALv2.md').includes(
    'Functional Source License, Version 1.1, ALv2 Future License'
  )
) {
  errors.push('LICENSES/FSL-1.1-ALv2.md must contain the FSL-1.1-ALv2 text');
}

for (const workspace of workspaces) {
  const expectedLicense = WORKSPACE_LICENSES[workspace];
  if (!expectedLicense) {
    errors.push(`${workspace} is missing from WORKSPACE_LICENSES`);
    continue;
  }

  const packageJson = readJson<{ license?: string; name?: string }>(`${workspace}/package.json`);
  if (packageJson.license !== expectedLicense) {
    errors.push(
      `${workspace}/package.json license must be ${expectedLicense}, found ${
        packageJson.license ?? '(missing)'
      }`
    );
  }

  const licensePath = `${workspace}/LICENSE.md`;
  if (!existsSync(path.join(ROOT, licensePath))) {
    errors.push(`${licensePath} is missing`);
    continue;
  }

  const licenseText = readText(licensePath);
  if (expectedLicense === 'Apache-2.0') {
    if (
      !licenseText.includes('Apache License') ||
      !licenseText.includes('Version 2.0, January 2004')
    ) {
      errors.push(`${licensePath} must contain the Apache License, Version 2.0 text`);
    }
    if (licenseText.includes('Functional Source License')) {
      errors.push(`${licensePath} must not contain FSL text for an Apache workspace`);
    }
  } else {
    const requiredSnippets = [
      'Functional Source License, Version 1.1, ALv2 Future License',
      'FSL-1.1-ALv2',
      'Copyright 2026 Userplane',
      `The Software is the ${packageJson.name} workspace (${workspace})`,
      'A Permitted Purpose is any purpose other than a Competing Use.',
      'Apache License, Version 2.0 that is effective on the second anniversary',
    ];

    for (const snippet of requiredSnippets) {
      if (!licenseText.includes(snippet)) {
        errors.push(`${licensePath} is missing FSL marker: ${snippet}`);
      }
    }
  }
}

for (const mappedWorkspace of Object.keys(WORKSPACE_LICENSES)) {
  if (!workspaces.includes(mappedWorkspace)) {
    errors.push(`${mappedWorkspace} is listed in WORKSPACE_LICENSES but has no package.json`);
  }
}

if (errors.length > 0) fail(errors);

console.log(`License check passed for ${workspaces.length} workspaces.`);
