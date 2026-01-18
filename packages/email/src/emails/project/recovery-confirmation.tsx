/**
 * Project - Recovery Confirmation Email
 * Sent when a project has been successfully recovered
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/recovery-confirmation';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectRecoveryConfirmationEmailProps {
  projectName?: string;
  dashboardUrl?: string;
}

export const ProjectRecoveryConfirmationEmail = ({
  projectName = 'My Project',
  dashboardUrl = 'https://app.userplane.io/dashboard',
}: ProjectRecoveryConfirmationEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(projectName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(projectName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={dashboardUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default ProjectRecoveryConfirmationEmail;
