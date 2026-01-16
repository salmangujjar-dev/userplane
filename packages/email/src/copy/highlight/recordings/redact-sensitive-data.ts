/**
 * Copy for Highlight Recordings - Redact Sensitive Data Email
 */

export const copy = {
  preview: 'Automatically redact sensitive data from recordings',
  title: 'Auto-redact sensitive data',
  subtitle: 'Blur passwords, credit cards, and confidential fields',
  body: [
    "Userplane automatically detects and blurs password fields, credit card inputs, and other sensitive elements before recordings leave the customer's browser.",
    'You can also add custom selectors to redact specific elements in your application.',
  ],
  cta: 'Configure redaction',
  ps: 'Redaction happens at the source. Sensitive data never reaches our servers.',
} as const;
