/**
 * Pilot Sandbox Invite Email
 * Sent to users invited to try Userplane in a sandbox environment
 */

import { Link, Section, Text } from '@react-email/components';
import { DOCS_URL } from '@userplane/contract';
import * as React from 'react';

import { copy } from '../../copy/invite/sandbox-invite';
import { EmailLayout } from '../../shared/layout';
import { LinkedText } from '../../shared/linked-text';
import * as styles from '../../shared/styles';

export interface SandboxInviteEmailProps {
  sandboxUrl: string;
  calendarUrl: string;
  logoUrl?: string;
}

export const SandboxInviteEmail = ({
  sandboxUrl,
  calendarUrl,
  logoUrl,
}: SandboxInviteEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={sandboxUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={calendarUrl} style={styles.secondaryButton}>
          {copy.secondaryCta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <LinkedText
          text={copy.footer}
          links={[{ start: 57, end: 84, href: `${DOCS_URL}/support/contact` }]}
          style={styles.smallText}
        />
      </Section>
    </EmailLayout>
  );
};

export default SandboxInviteEmail;
