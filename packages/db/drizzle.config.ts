import { defineConfig } from 'drizzle-kit';

// Strip sslrootcert=system from the URL to avoid pg-connection-string
// trying to open a file literally named 'system'. Cloud providers like
// Neon append this parameter, but drizzle-kit / pg handle SSL without it.
function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('sslrootcert');
    return parsed.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: sanitizeDatabaseUrl(process.env.DATABASE_URL || ''),
  },
});
