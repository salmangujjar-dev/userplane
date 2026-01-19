/**
 * Onboarding - Welcome Email Pilot
 * Sent to users who create a workspace with an invite token (invited/pilot users)
 */

import { Link, Section, Text } from '@react-email/components';

import { copy } from '../../copy/onboarding/welcome-email-pilot';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailPilotProps {
  userName?: string;
  workspaceName?: string;
  dashboardUrl?: string;
  calendarUrl?: string;
}

export const WelcomeEmailPilotEmail = ({
  userName = 'there',
  workspaceName = 'My Workspace',
  dashboardUrl = 'https://app.userplane.io',
  calendarUrl = 'https://cal.com/userplane/intro',
}: WelcomeEmailPilotProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.greeting(userName)}</Text>
        <Text style={styles.messageText}>{copy.body.intro(workspaceName)}</Text>
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
