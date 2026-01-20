/**
 * Offboarding - TOS Violation Email
 * Sent when an account is suspended for terms of service violation
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/offboarding/tos-violation';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface TosViolationEmailProps {
  appealUrl: string;
  tosUrl: string;
}

export const TosViolationEmail = ({ appealUrl, tosUrl }: TosViolationEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={appealUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          Review our{' '}
          <Link href={tosUrl} style={styles.link}>
            {copy.helpText}
          </Link>
          .
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default TosViolationEmail;
