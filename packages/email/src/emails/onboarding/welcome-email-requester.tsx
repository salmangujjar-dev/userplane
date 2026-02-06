/**
 * Onboarding - Welcome Email Requester
 * Sent to users when their access request is approved
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/onboarding/welcome-email-requester';
import { getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailRequesterProps {
  workspaceName: string;
  dashboardUrl: string;
  logoUrl?: string;
}

export const WelcomeEmailRequesterEmail = ({
  workspaceName,
  dashboardUrl,
  logoUrl,
}: WelcomeEmailRequesterProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](formattedWorkspaceName)}</Text>
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

export default WelcomeEmailRequesterEmail;
