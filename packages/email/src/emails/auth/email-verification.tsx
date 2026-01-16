/**
 * Auth - Email Verification Email
 * Sent when a user needs to verify their email address
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/auth/email-verification';

export interface EmailVerificationEmailProps {
  userName?: string;
  verificationUrl: string;
}

export const EmailVerificationEmail = ({
  userName = 'there',
  verificationUrl,
}: EmailVerificationEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} showSupport={false}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(userName)}</Text>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={verificationUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.fallbackText}</Text>
        <Text style={styles.smallText}>
          <Link href={verificationUrl} style={styles.link}>
            {verificationUrl}
          </Link>
        </Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default EmailVerificationEmail;
