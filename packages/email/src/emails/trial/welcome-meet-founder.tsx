/**
 * Trial Welcome - Meet the Founder Email
 * Personal welcome from the founder to new trial users
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/trial/welcome-meet-founder';

export interface WelcomeMeetFounderEmailProps {
  userName?: string;
  calendarUrl?: string;
  founderEmail?: string;
}

export const WelcomeMeetFounderEmail = ({
  userName = 'there',
  calendarUrl = 'https://cal.com/userplane/intro',
  founderEmail = 'founder@userplane.io',
}: WelcomeMeetFounderEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} showSupport={false}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(userName)}</Text>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={calendarUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.secondaryText}</Text>
      </Section>

      <Section style={styles.supportSection}>
        <Text style={styles.supportText}>
          <Link href={`mailto:${founderEmail}`} style={styles.supportLink}>
            {founderEmail}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeMeetFounderEmail;
