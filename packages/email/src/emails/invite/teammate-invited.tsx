/**
 * Invite - Teammate Invited Email
 * Sent when a user is invited to join a workspace
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/invite/teammate-invited';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface TeammateInvitedEmailProps {
  inviterName?: string;
  workspaceName?: string;
  inviteUrl?: string;
}

export const TeammateInvitedEmail = ({
  inviterName = 'John Doe',
  workspaceName = 'My Workspace',
  inviteUrl = 'https://app.userplane.io/invite/abc123',
}: TeammateInvitedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(inviterName, workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(inviterName, workspaceName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={inviteUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          {copy.helpText}{' '}
          <Link href={inviteUrl} style={styles.link}>
            {inviteUrl}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default TeammateInvitedEmail;
