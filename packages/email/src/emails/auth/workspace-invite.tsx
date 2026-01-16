/**
 * Auth - Workspace Invite Email
 * Sent when a user is invited to join a workspace
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/auth/workspace-invite';

export interface WorkspaceInviteEmailProps {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
}

export const WorkspaceInviteEmail = ({
  workspaceName,
  inviterName,
  inviteUrl,
}: WorkspaceInviteEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(inviterName, workspaceName)} showSupport={false}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](inviterName, workspaceName)}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={inviteUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.fallbackText}</Text>
        <Text style={styles.smallText}>
          <Link href={inviteUrl} style={styles.link}>
            {inviteUrl}
          </Link>
        </Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default WorkspaceInviteEmail;
