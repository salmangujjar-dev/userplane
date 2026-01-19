/**
 * Pilot Sandbox Invite Email
 * Sent to users invited to try Userplane in a sandbox environment
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/invite/sandbox-invite';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface SandboxInviteEmailProps {
  sandboxUrl?: string;
  expiresInDays?: number;
}

export const SandboxInviteEmail = ({
  sandboxUrl = 'https://app.userplane.io/sandbox',
  expiresInDays = 14,
}: SandboxInviteEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
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
