/**
 * Project - Recovery Partially Email
 * Sent when a project has been partially restored
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/recovery-partially';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectRecoveryPartiallyEmailProps {
  projectName?: string;
  dashboardUrl?: string;
}

export const ProjectRecoveryPartiallyEmail = ({
  projectName = 'My Project',
  dashboardUrl = 'https://app.userplane.io/dashboard',
}: ProjectRecoveryPartiallyEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(projectName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(projectName)}</Text>

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
