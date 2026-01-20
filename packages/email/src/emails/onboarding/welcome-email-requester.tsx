/**
 * Onboarding - Welcome Email Requester
 * Sent to users when their access request is approved
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-requester';
import { getUserName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailRequesterProps {
  userName: string;
  workspaceName: string;
  dashboardUrl: string;
}

export const WelcomeEmailRequesterEmail = ({
  userName,
  workspaceName,
  dashboardUrl,
}: WelcomeEmailRequesterProps) => {
  const formattedUserName = getUserName(userName);
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(formattedUserName)}</Text>
        <Text style={styles.messageText}>{copy.body(formattedWorkspaceName)}</Text>
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

export default WelcomeEmailRequesterEmail;
