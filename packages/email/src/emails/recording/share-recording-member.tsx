/**
 * Recording - Share Recording Member Email
 * Sent when a workspace member shares a recording with another member
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/recording/share-recording-member';
import { getTeammateName } from '../../shared';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ShareRecordingMemberEmailProps {
  senderName: string;
  recordingUrl: string;
  logoUrl?: string;
}

export const ShareRecordingMemberEmail = ({
  senderName,
  recordingUrl,
  logoUrl,
}: ShareRecordingMemberEmailProps) => {
  senderName = getTeammateName(senderName);
  return (
    <EmailLayout preview={copy.preview(senderName)} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(senderName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={recordingUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          <Link href={recordingUrl} style={styles.link}>
            {copy.fallbackText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default ShareRecordingMemberEmail;
