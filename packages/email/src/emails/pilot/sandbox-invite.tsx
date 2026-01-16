/**
 * Pilot Sandbox Invite Email
 * Sent to users invited to try Userplane in a sandbox environment
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/pilot/sandbox-invite';

export interface SandboxInviteEmailProps {
  sandboxUrl?: string;
  expiresInDays?: number;
}

export const SandboxInviteEmail = ({
  sandboxUrl = 'https://app.userplane.io/sandbox',
  expiresInDays = 14,
}: SandboxInviteEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} ps={copy.ps}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1](expiresInDays)}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={sandboxUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default SandboxInviteEmail;
