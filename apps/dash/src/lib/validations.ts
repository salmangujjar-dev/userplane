import { z } from 'zod';
import validator from 'validator';

/**
 * Zod schema for validating URL strings with protocol (http/https)
 * Example: "https://example.com" or "http://example.com"
 */
export const urlWithProtocolSchema = z
  .string()
  .min(1, 'URL is required')
  .refine(
    (value) => {
      // Skip validation if empty (will be caught by .min())
      if (!value || value.trim() === '') return true;

      // Allow localhost and local IPs
      return validator.isURL(value, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https'],
        require_host: true,
        require_tld: false, // Allow localhost without TLD
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
      });
    },
    {
      message: 'Please enter a valid URL',
    }
  );

/**
 * Zod schema for validating domain URLs
 * Ensures the URL is valid and has a proper domain format
 * Accepts: example.com, subdomain.example.com, localhost, 127.0.0.1
 * Rejects: single characters, incomplete domains
 */
export const domainUrlSchema = z
  .string()
  .min(1, 'Domain URL is required')
  .refine(
    (value) => {
      // Skip validation if empty (will be caught by .min())
      if (!value || value.trim() === '') return true;

      // Allow localhost and local IPs in validator check
      return validator.isURL(value, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https'],
        require_host: true,
        require_tld: false, // Allow localhost without TLD
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
      });
    },
    {
      message: 'Please enter a valid URL with protocol (e.g., https://example.com)',
    }
  )
  .refine((value) => {
    // Skip validation if empty (will be caught by .min())
    if (!value || value.trim() === '') return true;

    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();

      // Allow localhost
      if (hostname === 'localhost') return true;

      // Allow valid IP addresses (IPv4 and IPv6)
      if (validator.isIP(hostname)) return true;

      // Allow local development domains (e.g., localhost:3000, 127.0.0.1:3000)
      if (hostname.startsWith('127.') || hostname.startsWith('0.0.0.0')) return true;

      // Validate as FQDN (fully qualified domain name)
      // Require at least one dot for proper domains
      return validator.isFQDN(hostname, {
        require_tld: true,
        allow_underscores: false,
        allow_trailing_dot: false,
      });
    } catch {
      // If URL parsing fails, return false
      return false;
    }
  }, 'Please enter a valid domain (e.g., example.com, localhost, 127.0.0.1)');

/**
 * Zod schema for optional URL validation
 * Allows empty strings but validates format if provided
 */
export const optionalUrlSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true;

      // Allow localhost and local IPs
      return validator.isURL(value, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https'],
        require_host: true,
        require_tld: false, // Allow localhost without TLD
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
      });
    },
    { message: 'Please enter a valid URL' }
  );

/**
 * Zod schema for validating email domains (FQDNs only, no protocol required)
 * Accepts: example.com, subdomain.example.com, mail.company.org
 * Rejects: https://example.com, localhost, 127.0.0.1, single words
 */
export const emailDomainSchema = z
  .string()
  .min(1, 'Email domain is required')
  .trim()
  .refine((value) => {
    // Skip validation if empty (will be caught by .min())
    if (!value || value.trim() === '') return true;

    // Should not contain protocol
    if (value.match(/^https?:\/\//i)) {
      return false;
    }

    // Validate as FQDN (fully qualified domain name)
    return validator.isFQDN(value, {
      require_tld: true,
      allow_underscores: false,
      allow_trailing_dot: false,
    });
  }, 'Please enter a valid domain (e.g., example.com)');

/**
 * Helper function to extract domain from URL
 * Returns the hostname from a URL string
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// ============================================================================
// WORKSPACE & ACCOUNT SCHEMAS
// ============================================================================

/**
 * Schema for workspace name validation
 * Trims whitespace and validates the trimmed value
 */
export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Workspace name is required')
  .min(2, 'Workspace name must be at least 2 characters')
  .max(100, 'Workspace name must be less than 100 characters');

/**
 * Schema for billing email validation
 * Trims whitespace and validates the trimmed value
 */
export const billingEmailSchema = z
  .string()
  .trim()
  .min(1, 'Billing email is required')
  .email('Please enter a valid email address');

/**
 * Schema for account name validation
 * Trims whitespace and validates the trimmed value
 */
export const accountNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

/**
 * Schema for project title validation
 * Trims whitespace and validates the trimmed value
 */
export const projectTitleSchema = z
  .string()
  .trim()
  .min(1, 'Project title is required')
  .min(2, 'Project title must be at least 2 characters')
  .max(200, 'Project title must be less than 200 characters');

// ============================================================================
// RECORDING LINK CUSTOMIZATION SCHEMAS
// ============================================================================

/**
 * Schema for company name validation
 * Trims whitespace and validates the trimmed value
 */
export const companyNameSchema = z
  .string()
  .trim()
  .min(1, 'Company name is required')
  .max(100, 'Company name must be less than 100 characters');

/**
 * Schema for recording header text
 */
export const recordingHeaderSchema = z
  .string()
  .max(200, 'Header must be less than 200 characters')
  .trim()
  .optional();

/**
 * Schema for recording footnote text
 */
export const recordingFootnoteSchema = z
  .string()
  .max(500, 'Footnote must be less than 500 characters')
  .trim()
  .optional();

/**
 * Schema for hex color validation
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color (e.g., #FF5733)')
  .transform((val) => val.toUpperCase());

// ============================================================================
// INVITE POLICY SCHEMAS
// ============================================================================

/**
 * Schema for invite policy type
 */
export const invitePolicySchema = z.enum(['private', 'whitelisted', 'protected'], {
  errorMap: () => ({ message: 'Please select a valid invite policy' }),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

/**
 * Schema for notification settings (all boolean toggles)
 */
export const notificationSettingsSchema = z.object({
  notifyOnLinkUsage: z.boolean(),
  notifyOnQuotaReset: z.boolean(),
  notifyOnQuotaLimit: z.boolean(),
  notifyOnMemberJoin: z.boolean(),
  notifyOnInviteAccepted: z.boolean(),
});

// ============================================================================
// ADMIN PROVISION WORKSPACE SCHEMAS
// ============================================================================

/**
 * Schema for workspace member in provision form
 */
export const provisionMemberSchema = z.object({
  email: billingEmailSchema,
  name: accountNameSchema,
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

/**
 * Schema for admin provision workspace form
 */
export const provisionWorkspaceSchema = z.object({
  owner: z.object({
    email: billingEmailSchema,
    name: accountNameSchema,
  }),
  workspace: z.object({
    name: workspaceNameSchema,
    url: urlWithProtocolSchema,
    plan: z.string().min(1, 'Please select a plan'),
  }),
  members: z.array(provisionMemberSchema),
});

// ============================================================================
// INVITE SCHEMAS
// ============================================================================

/**
 * Schema for individual invite email
 */
export const inviteEmailSchema = z.object({
  email: billingEmailSchema,
  isValid: z.boolean().default(true),
});

/**
 * Schema for invite form
 * At least one valid email is required
 */
export const inviteFormSchema = z
  .object({
    emails: z.array(inviteEmailSchema).min(1, 'At least one email is required'),
  })
  .refine((data) => data.emails.some((e) => e.isValid), {
    message: 'At least one valid email is required',
    path: ['emails'],
  });
