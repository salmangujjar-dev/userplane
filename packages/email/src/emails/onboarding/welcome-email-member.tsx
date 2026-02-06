/**
 * Onboarding - Welcome Email Member
 * Sent to users when they join a workspace as a member
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-member';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailMemberProps {
  workspaceName: string;
  dashboardUrl: string;
  logoUrl?: string;
}

export const WelcomeEmailMemberEmail = ({ dashboardUrl, logoUrl }: WelcomeEmailMemberProps) => {
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
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailMemberEmail;
