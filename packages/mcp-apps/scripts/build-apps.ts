/**
 * Build all MCP apps in parallel.
 *
 * vite-plugin-singlefile doesn't support multiple entry points, so each app
 * needs its own vite build. Running them in parallel keeps the total build
 * time close to a single build (~5s) instead of 4× sequential (~18s).
 *
 * Each build only writes a single HTML file to dist/<app>/index.html,
 * so there are no file-system conflicts between parallel builds.
 */
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');

const APPS = ['show-recording', 'show-rec-console', 'show-rec-network', 'show-rec-actions'];

rmSync(DIST, { recursive: true, force: true });

const results = await Promise.all(
  APPS.map(
    (app) =>
      Bun.spawn(['bun', 'vite', 'build'], {
        cwd: ROOT,
        env: { ...process.env, MCP_APP: app },
        stdout: 'inherit',
        stderr: 'inherit',
      }).exited
  )
);

const failed = APPS.filter((_, i) => results[i] !== 0);
if (failed.length > 0) {
  console.error(`\nBuild failed for: ${failed.join(', ')}`);
  process.exit(1);
}
