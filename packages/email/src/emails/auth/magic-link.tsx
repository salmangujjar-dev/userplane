/**
 * Auth - Magic Link Email
 * Sent when a user requests passwordless sign in
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/auth/magic-link';

export interface MagicLinkEmailProps {
  magicLinkUrl: string;
}

export const MagicLinkEmail = ({ magicLinkUrl }: MagicLinkEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} showSupport={false}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={magicLinkUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.fallbackText}</Text>
        <Text style={styles.smallText}>
          <Link href={magicLinkUrl} style={styles.link}>
            {magicLinkUrl}
          </Link>
        </Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default MagicLinkEmail;
