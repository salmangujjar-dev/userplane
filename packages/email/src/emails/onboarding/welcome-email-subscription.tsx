/**
 * Onboarding - Welcome Email Subscription
 * Sent to users who create a workspace without an invite token (organic signup)
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-subscription';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailSubscriptionProps {
  workspaceName: string;
  dashboardUrl: string;
}

export const WelcomeEmailSubscriptionEmail = ({ dashboardUrl }: WelcomeEmailSubscriptionProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailSubscriptionEmail;
