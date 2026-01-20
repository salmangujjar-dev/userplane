/**
 * Project - Recovery Confirmation Email
 * Sent when a project has been successfully recovered
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/recovery-confirmation';
import { getProjectName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectRecoveryConfirmationEmailProps {
  projectName: string;
  dashboardUrl: string;
}

export const ProjectRecoveryConfirmationEmail = ({
  projectName,
  dashboardUrl,
}: ProjectRecoveryConfirmationEmailProps) => {
  const formattedProjectName = getProjectName(projectName);

  return (
    <EmailLayout preview={copy.preview(formattedProjectName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(formattedProjectName)}</Text>

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
