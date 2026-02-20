#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * This script:
 * 1. Scans all apps for environment variable usage
 * 2. Compares with turbo.json declarations
 * 3. Reports missing or unused declarations
 * 4. Validates .env.example files
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const TURBO_JSON_PATH = path.join(WORKSPACE_ROOT, 'turbo.json');

const APPS = [
  { name: 'api', path: 'apps/api', type: 'node' },
  { name: 'dash', path: 'apps/dash', type: 'next' },
  { name: 'home', path: 'apps/home', type: 'astro' },
  { name: 'recorder', path: 'apps/recorder', type: 'astro' },
  { name: 'ramp', path: 'apps/ramp', type: 'next' },
];

/**
 * Extract environment variables from code files
 */
function extractEnvVarsFromCode(filePath, fileContent) {
  const envVars = new Set();

  // Match process.env.VARIABLE_NAME
  const processEnvRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  let match;
  while ((match = processEnvRegex.exec(fileContent)) !== null) {
    envVars.add(match[1]);
  }

  // Match import.meta.env.VARIABLE_NAME (for Astro/Vite)
  const importMetaEnvRegex = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;
  while ((match = importMetaEnvRegex.exec(fileContent)) !== null) {
    envVars.add(match[1]);
  }

  return Array.from(envVars);
}

/**
 * Recursively scan directory for source files
 */
function scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx', '.astro']) {
  const envVars = new Set();

  if (!fs.existsSync(dirPath)) {
    return Array.from(envVars);
  }

  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, dist, .next, etc.
        if (['node_modules', 'dist', '.next', '.astro', 'coverage'].includes(entry.name)) {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const vars = extractEnvVarsFromCode(fullPath, content);
            vars.forEach((v) => envVars.add(v));
          } catch (error) {
            console.warn(`Warning: Could not read file ${fullPath}: ${error.message}`);
          }
        }
      }
    }
  }

  walkDir(dirPath);
  return Array.from(envVars);
}

/**
 * Parse .env.example file
 */
function parseEnvExample(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const envVars = new Set();

  // Match VAR_NAME= or VAR_NAME=value
  const envVarRegex = /^([A-Z_][A-Z0-9_]*)=/gm;
  let match;
  while ((match = envVarRegex.exec(content)) !== null) {
    envVars.add(match[1]);
  }

  return Array.from(envVars);
}

/**
 * Load turbo.json and extract declared env vars
 */
function loadTurboJsonEnvVars() {
  const turboJson = JSON.parse(fs.readFileSync(TURBO_JSON_PATH, 'utf-8'));
  const envVars = new Set();

  // Add global env vars
  if (turboJson.globalEnv) {
    turboJson.globalEnv.forEach((v) => envVars.add(v));
  }

  // Add task-specific env vars
  if (turboJson.tasks) {
    for (const [taskName, taskConfig] of Object.entries(turboJson.tasks)) {
      if (taskConfig.env) {
        taskConfig.env.forEach((v) => envVars.add(v));
      }
    }
  }

  return Array.from(envVars).sort();
}

/**
 * Main validation function
 */
function validateEnvironmentVariables() {
  console.log('Environment Variables Validation\n');
  console.log('='.repeat(80));
  console.log();

  const turboEnvVars = loadTurboJsonEnvVars();
  console.log(`Turbo.json declares ${turboEnvVars.length} environment variables`);
  console.log();

  const allUsedEnvVars = new Set();
  const allExampleEnvVars = new Set();
  const appReports = [];

  // Scan each app
  for (const app of APPS) {
    const appPath = path.join(WORKSPACE_ROOT, app.path);
    const srcPath = path.join(appPath, 'src');
    const envExamplePath = path.join(appPath, '.env.example');

    console.log(`Scanning ${app.name} (${app.type})...`);

    // Get env vars from code
    const codeEnvVars = scanDirectory(srcPath);
    codeEnvVars.forEach((v) => allUsedEnvVars.add(v));

    // Get env vars from .env.example
    const exampleEnvVars = parseEnvExample(envExamplePath);
    exampleEnvVars.forEach((v) => allExampleEnvVars.add(v));

    appReports.push({
      app: app.name,
      type: app.type,
      codeEnvVars: codeEnvVars.sort(),
      exampleEnvVars: exampleEnvVars.sort(),
      hasEnvExample: fs.existsSync(envExamplePath),
    });

    console.log(`  - Found ${codeEnvVars.length} env vars in code`);
    console.log(`  - Found ${exampleEnvVars.length} env vars in .env.example`);
    console.log();
  }

  // Convert sets to arrays
  const usedEnvVars = Array.from(allUsedEnvVars).sort();
  const exampleEnvVars = Array.from(allExampleEnvVars).sort();

  // Find missing declarations in turbo.json
  const missingInTurbo = usedEnvVars.filter((v) => !turboEnvVars.includes(v));

  // Find unused declarations in turbo.json
  const unusedInTurbo = turboEnvVars.filter((v) => !usedEnvVars.includes(v));

  // Find vars in code but not in .env.example
  const missingInExample = usedEnvVars.filter((v) => !exampleEnvVars.includes(v));

  // Print detailed app reports
  console.log('='.repeat(80));
  console.log('DETAILED APP REPORTS');
  console.log('='.repeat(80));
  console.log();

  for (const report of appReports) {
    console.log(`${report.app} (${report.type})`);
    console.log('-'.repeat(40));

    if (report.codeEnvVars.length > 0) {
      console.log('  Environment variables used in code:');
      report.codeEnvVars.forEach((v) => console.log(`    - ${v}`));
    } else {
      console.log('  No environment variables used in code');
    }

    console.log();

    if (report.hasEnvExample) {
      if (report.exampleEnvVars.length > 0) {
        console.log('  Environment variables in .env.example:');
        report.exampleEnvVars.forEach((v) => console.log(`    - ${v}`));
      } else {
        console.log('  .env.example is empty');
      }
    } else {
      console.log('  No .env.example file');
    }

    console.log();
  }

  // Print summary
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log();

  console.log(`Total unique environment variables used in code: ${usedEnvVars.length}`);
  console.log(`Total declared in turbo.json: ${turboEnvVars.length}`);
  console.log(`Total in .env.example files: ${exampleEnvVars.length}`);
  console.log();

  let hasErrors = false;

  if (missingInTurbo.length > 0) {
    hasErrors = true;
    console.log('ERROR: Environment variables used in code but NOT declared in turbo.json:');
    missingInTurbo.forEach((v) => console.log(`  - ${v}`));
    console.log();
  }

  if (unusedInTurbo.length > 0) {
    console.log('WARNING: Environment variables declared in turbo.json but NOT used in code:');
    unusedInTurbo.forEach((v) => console.log(`  - ${v}`));
    console.log('(These might be used at runtime or in configuration files)');
    console.log();
  }

  if (missingInExample.length > 0) {
    console.log('INFO: Environment variables used in code but NOT in any .env.example:');
    missingInExample.forEach((v) => console.log(`  - ${v}`));
    console.log();
  }

  if (!hasErrors && missingInTurbo.length === 0) {
    console.log('✓ All environment variables are properly declared in turbo.json');
  }

  console.log();
  console.log('='.repeat(80));

  // Exit with error code if there are missing declarations
  if (hasErrors) {
    process.exit(1);
  }
}

// Run validation
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Error running validation:', error);
  process.exit(1);
}
