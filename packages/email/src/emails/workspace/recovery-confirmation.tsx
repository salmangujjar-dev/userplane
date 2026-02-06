/**
 * Workspace - Recovery Confirmation Email
 * Sent when a workspace has been fully recovered
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/workspace/recovery-confirmation';
import { getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface RecoveryConfirmationEmailProps {
  workspaceName: string;
  dashboardUrl: string;
  logoUrl?: string;
}

export const RecoveryConfirmationEmail = ({
  workspaceName,
  dashboardUrl,
  logoUrl,
}: RecoveryConfirmationEmailProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview(formattedWorkspaceName)} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(formattedWorkspaceName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default RecoveryConfirmationEmail;
