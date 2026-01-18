/**
 * Project - Deletion Requested Email
 * Sent to admins when a member requests project deletion
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/project/deletion-requested';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ProjectDeletionRequestedEmailProps {
  projectName?: string;
  requesterName?: string;
  requesterEmail?: string;
  deletionDate?: string;
  cancelUrl?: string;
}

export const ProjectDeletionRequestedEmail = ({
  projectName = 'My Project',
  requesterName = 'Jane Smith',
  requesterEmail = 'jane@example.com',
  deletionDate = 'January 30, 2025',
  cancelUrl = 'https://app.userplane.io/settings/project',
}: ProjectDeletionRequestedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(requesterName, projectName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>
        {copy.subtitle(requesterName, requesterEmail, projectName)}
      </Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](deletionDate)}</Text>
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

export default ProjectDeletionRequestedEmail;
