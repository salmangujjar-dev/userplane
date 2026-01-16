/**
 * Activation - Helpdesk Integration Prompt Email
 * Encourage users to connect their helpdesk (e.g., Intercom)
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/activation/helpdesk-integration-prompt';

export interface HelpdeskIntegrationPromptEmailProps {
  integrationsUrl?: string;
}

export const HelpdeskIntegrationPromptEmail = ({
  integrationsUrl = 'https://app.userplane.io/settings/integrations',
}: HelpdeskIntegrationPromptEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} ps={copy.ps}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={integrationsUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default HelpdeskIntegrationPromptEmail;
