/**
 * Workspace Invite Email
 * Sent to users invited to create a workspace on Userplane
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/invite/workspace-invite';
import { EmailLayout } from '../../shared/layout';
import { LinkedText } from '../../shared/linked-text';
import * as styles from '../../shared/styles';

export interface WorkspaceInviteEmailProps {
  inviteUrl: string;
  calendarUrl: string;
  logoUrl?: string;
}

export const WorkspaceInviteEmail = ({
  inviteUrl,
  calendarUrl,
  logoUrl,
}: WorkspaceInviteEmailProps) => {
  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={inviteUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={calendarUrl} style={styles.secondaryButton}>
          {copy.secondaryCta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <LinkedText
          text={copy.footer}
          links={[{ start: 57, end: 84, href: 'https://www.userplane.io/help/support/contact-us' }]}
          style={styles.smallText}
        />
      </Section>
    </EmailLayout>
  );
};

export default WorkspaceInviteEmail;
