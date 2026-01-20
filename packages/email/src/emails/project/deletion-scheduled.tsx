/**
 * Project - Deletion Scheduled Email
 * Sent when a project is scheduled for deletion
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/deletion-scheduled';
import { getDeletionDate, getProjectName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectDeletionScheduledEmailProps {
  projectName: string;
  deletionDate: string;
  cancelUrl: string;
}

export const ProjectDeletionScheduledEmail = ({
  projectName,
  deletionDate,
  cancelUrl,
}: ProjectDeletionScheduledEmailProps) => {
  const formattedProjectName = getProjectName(projectName);
  const formattedDeletionDate = getDeletionDate(deletionDate);

  return (
    <EmailLayout preview={copy.preview(formattedProjectName, formattedDeletionDate)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>
        {copy.subtitle(formattedProjectName, formattedDeletionDate)}
      </Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](formattedDeletionDate)}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={cancelUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default ProjectDeletionScheduledEmail;
