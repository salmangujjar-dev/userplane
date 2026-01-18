/**
 * Project - Recovery Scheduled Email
 * Sent when a project is scheduled for recovery
 */

import { Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/recovery-scheduled';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectRecoveryScheduledEmailProps {
  projectName?: string;
}

export const ProjectRecoveryScheduledEmail = ({
  projectName = 'My Project',
}: ProjectRecoveryScheduledEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(projectName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(projectName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>
    </EmailLayout>
  );
};

export default ProjectRecoveryScheduledEmail;
