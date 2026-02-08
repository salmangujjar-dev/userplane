/**
 * Onboarding - Welcome Email Pilot
 * Sent to users who create a workspace with an invite token (invited/pilot users)
 */

import { Link, Section, Text } from '@react-email/components';

import { copy } from '../../copy/onboarding/welcome-email-pilot';
import { EmailLayout } from '../../shared/layout';
import { LinkedText } from '../../shared/linked-text';
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
        <LinkedText
          text={copy.footer}
          links={[{ start: 57, end: 84, href: 'https://www.userplane.io/help/support/contact-us' }]}
          style={styles.smallText}
        />
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmailPilotEmail;
