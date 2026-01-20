/**
 * Offboarding - TOS Violation Email
 * Sent when an account is suspended for terms of service violation
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/offboarding/tos-violation';
import { getAppealUrl, getTosUrl, getUserName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface TosViolationEmailProps {
  userName: string;
}

export const TosViolationEmail = ({ userName }: TosViolationEmailProps) => {
  const formattedUserName = getUserName(userName);
  const appealUrl = getAppealUrl();
  const tosUrl = getTosUrl();

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(formattedUserName)}</Text>
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
