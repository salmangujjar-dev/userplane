/**
 * Onboarding - Welcome Email Pilot
 * Sent to users who create a workspace with an invite token (invited/pilot users)
 */

import { Link, Section, Text } from '@react-email/components';

import { copy } from '../../copy/onboarding/welcome-email-pilot';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface WelcomeEmailPilotProps {
  workspaceName: string;
  dashboardUrl: string;
  calendarUrl: string;
  logoUrl?: string;
}

export const WelcomeEmailPilotEmail = ({
  dashboardUrl,
  calendarUrl,
  logoUrl,
}: WelcomeEmailPilotProps) => {
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

      <Section style={styles.ctaSection}>
        <Link href={calendarUrl} style={styles.secondaryButton}>
          {copy.secondaryCta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailPilotEmail;
