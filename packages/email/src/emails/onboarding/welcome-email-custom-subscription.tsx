/**
 * Onboarding - Welcome Email Custom Subscription
 * Sent after admin workspace provisioning when checkout is required
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-custom-subscription';
import { EmailLayout } from '../../shared/layout';
import { LinkedText } from '../../shared/linked-text';
import * as styles from '../../shared/styles';

export interface WelcomeEmailCustomSubscriptionProps {
  workspaceName: string;
  checkoutUrl: string;
  calendarUrl: string;
  logoUrl?: string;
}

export const WelcomeEmailCustomSubscriptionEmail = ({
  checkoutUrl,
  calendarUrl,
  logoUrl,
}: WelcomeEmailCustomSubscriptionProps) => {
  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={checkoutUrl} style={styles.ctaButton}>
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
          links={[{ start: 61, end: 89, href: 'https://www.userplane.io/help/support/contact-us' }]}
          style={styles.smallText}
        />
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailCustomSubscriptionEmail;
