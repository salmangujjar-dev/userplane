/**
 * Invite - Teammate Joined Email
 * Sent to workspace owners when a user joins a workspace
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/invite/teammate-joined';
import { getMemberName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface TeammateJoinedEmailProps {
  memberName: string;
  memberEmail: string;
  workspaceName: string;
  workspaceUrl: string;
}

export const TeammateJoinedEmail = ({
  memberName,
  memberEmail,
  workspaceName,
  workspaceUrl,
}: TeammateJoinedEmailProps) => {
  const formattedMemberName = getMemberName(memberName);
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview(formattedMemberName, memberEmail, formattedWorkspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>
        {copy.subtitle(formattedMemberName, memberEmail, formattedWorkspaceName)}
      </Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={workspaceUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default TeammateJoinedEmail;
