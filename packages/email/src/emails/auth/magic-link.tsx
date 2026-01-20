/**
 * Auth - Magic Link Email
 * Sent when a user requests passwordless sign in
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/auth/magic-link';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

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
        <Text style={styles.smallText}>
          <Link href={magicLinkUrl} style={styles.link}>
            {copy.fallbackText}
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
