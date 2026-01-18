/**
 * Workspace - Deletion Confirmation Email
 * Sent when a workspace has been permanently deleted
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/workspace/deletion-confirmation';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface DeletionConfirmationEmailProps {
  workspaceName?: string;
  feedbackUrl?: string;
}

export const DeletionConfirmationEmail = ({
  workspaceName = 'My Workspace',
  feedbackUrl = 'https://userplane.io/feedback',
}: DeletionConfirmationEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](workspaceName)}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          If you have feedback about your experience,{' '}
          <Link href={feedbackUrl} style={styles.link}>
            {copy.helpText}
          </Link>
          .
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default DeletionConfirmationEmail;
