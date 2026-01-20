/**
 * Project - Recovery Partially Email
 * Sent when a project has been partially restored
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/recovery-partially';
import { getProjectName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectRecoveryPartiallyEmailProps {
  projectName: string;
  dashboardUrl: string;
}

export const ProjectRecoveryPartiallyEmail = ({
  projectName,
  dashboardUrl,
}: ProjectRecoveryPartiallyEmailProps) => {
  const formattedProjectName = getProjectName(projectName);

  return (
    <EmailLayout preview={copy.preview(formattedProjectName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(formattedProjectName)}</Text>

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

export default ProjectRecoveryPartiallyEmail;
