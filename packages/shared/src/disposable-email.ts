import disposableEmailDomains from './data/email.json';

// Type assertion for the imported JSON
const disposableDomains = disposableEmailDomains as Record<string, boolean>;

/**
 * Check if a domain is a disposable email domain
 * @param domain - The domain to check (e.g., "tempmail.com")
 * @returns true if the domain is disposable
 */
export function isDisposableEmailDomain(domain: string): boolean {
  const normalizedDomain = domain.trim().toLowerCase();
  return disposableDomains[normalizedDomain] === true;
}

/**
 * Check if an email address uses a disposable email domain
 * @param email - The email address to check (e.g., "user@tempmail.com")
 * @returns true if the email uses a disposable domain
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return isDisposableEmailDomain(domain);
}

/**
 * Extract domain from an email address
 * @param email - The email address
 * @returns The domain part of the email
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.trim().toLowerCase() || '';
}

/**
 * Filter out disposable domains from an array of domains
 * @param domains - Array of domain strings
 * @returns Object with valid domains and disposable domains
 */
export function filterDisposableDomains(domains: string[]): {
  validDomains: string[];
  disposableDomains: string[];
} {
  const validDomains: string[] = [];
  const disposableDomains: string[] = [];

  for (const domain of domains) {
    const normalized = domain.trim().toLowerCase();
    if (isDisposableEmailDomain(normalized)) {
      disposableDomains.push(normalized);
    } else {
      validDomains.push(normalized);
    }
  }

  return { validDomains, disposableDomains };
}
