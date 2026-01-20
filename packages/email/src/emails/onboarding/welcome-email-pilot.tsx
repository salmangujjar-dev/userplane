/**
 * Onboarding - Welcome Email Pilot
 * Sent to users who create a workspace with an invite token (invited/pilot users)
 */

import { Link, Section, Text } from '@react-email/components';

import { copy } from '../../copy/onboarding/welcome-email-pilot';
import { getUserName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailPilotProps {
  userName: string;
  workspaceName: string;
  dashboardUrl: string;
  calendarUrl: string;
}

export const WelcomeEmailPilotEmail = ({
  userName,
  workspaceName,
  dashboardUrl,
  calendarUrl,
}: WelcomeEmailPilotProps) => {
  const formattedUserName = getUserName(userName);
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(formattedUserName)}</Text>
        <Text style={styles.messageText}>{copy.body.intro(formattedWorkspaceName)}</Text>
        <Text style={styles.messageText}>{copy.body.explore}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body.call}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={calendarUrl} style={styles.secondaryButton}>
          {copy.secondaryCta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailPilotEmail;
