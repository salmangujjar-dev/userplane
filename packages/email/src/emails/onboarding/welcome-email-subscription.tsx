/**
 * Onboarding - Welcome Email Subscription
 * Sent to users who create a workspace without an invite token (organic signup)
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-subscription';
import { EmailLayout } from '../../shared/layout';
import { LinkedText } from '../../shared/linked-text';
import * as styles from '../../shared/styles';

export interface WelcomeEmailSubscriptionProps {
  workspaceName: string;
  dashboardUrl: string;
  logoUrl?: string;
}

export const WelcomeEmailSubscriptionEmail = ({
  dashboardUrl,
  logoUrl,
}: WelcomeEmailSubscriptionProps) => {
  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
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
        <LinkedText
          text={copy.footer}
          links={[{ start: 57, end: 84, href: 'https://www.userplane.io/help/support/contact-us' }]}
          style={styles.smallText}
        />
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailSubscriptionEmail;
