/**
 * Onboarding - Welcome Email Member
 * Sent to users when they join a workspace as a member
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-member';
import { getUserName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailMemberProps {
  userName: string;
  workspaceName: string;
  dashboardUrl: string;
}

export const WelcomeEmailMemberEmail = ({
  userName,
  workspaceName,
  dashboardUrl,
}: WelcomeEmailMemberProps) => {
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

export default WelcomeEmailMemberEmail;
