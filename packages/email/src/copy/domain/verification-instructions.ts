/**
 * Copy for Domain - Verification Instructions Email
 */

export const copy = {
  preview: (domainName: string) => `Verify ${domainName} to start receiving recordings`,
  title: 'Verify your domain',
  subtitle: (domainName: string) => `Add a DNS record to verify ${domainName}`,
  body: [
    (domainName: string) =>
      `To receive recordings from ${domainName}, add this TXT record to your DNS settings:`,
    'After adding the record, return to Userplane and click verify. DNS propagation typically takes a few minutes.',
  ],
  cta: 'Verify domain',
  helpText: 'View detailed verification guide',
} as const;
