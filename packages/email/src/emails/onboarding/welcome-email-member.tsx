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
  userName?: string;
  workspaceName?: string;
  dashboardUrl?: string;
}

export const WelcomeEmailMemberEmail = ({
  userName = 'there',
  workspaceName = 'My Workspace',
  dashboardUrl = 'https://app.userplane.io',
}: WelcomeEmailMemberProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(userName)}</Text>
        <Text style={styles.messageText}>{copy.body(workspaceName)}</Text>
        <Text style={styles.messageText}>{copy.body2}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailMemberEmail;
