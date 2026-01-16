/**
 * Workspace - Access Granted Email
 * Sent when a user's access request is approved
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/workspace/access-granted';

export interface AccessGrantedEmailProps {
  workspaceName?: string;
  dashboardUrl?: string;
}

export const AccessGrantedEmail = ({
  workspaceName = 'My Workspace',
  dashboardUrl = 'https://app.userplane.io/dashboard',
}: AccessGrantedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(workspaceName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](workspaceName)}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default AccessGrantedEmail;
