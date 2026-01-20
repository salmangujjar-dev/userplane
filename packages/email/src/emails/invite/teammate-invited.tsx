/**
 * Invite - Teammate Invited Email
 * Sent when a user is invited to join a workspace
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/invite/teammate-invited';
import { getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface TeammateInvitedEmailProps {
  workspaceName: string;
  inviteUrl: string;
}

export const TeammateInvitedEmail = ({ workspaceName, inviteUrl }: TeammateInvitedEmailProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);

  return (
    <EmailLayout preview={copy.preview(formattedWorkspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(formattedWorkspaceName)}</Text>

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
          <Link href={inviteUrl} style={styles.link}>
            {copy.fallbackText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default TeammateInvitedEmail;
