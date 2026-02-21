/**
 * Recording - Share Recording External Email
 * Sent when a workspace member shares a recording with a non-member
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/recording/share-recording-external';
import { getTeammateName } from '../../shared';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ShareRecordingExternalEmailProps {
  senderName: string;
  inviteUrl: string;
  recordingUrl: string;
  logoUrl?: string;
}

export const ShareRecordingExternalEmail = ({
  senderName,
  inviteUrl,
  recordingUrl,
  logoUrl,
}: ShareRecordingExternalEmailProps) => {
  senderName = getTeammateName(senderName);
  return (
    <EmailLayout preview={copy.preview(senderName)} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(senderName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={inviteUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={recordingUrl} style={styles.secondaryButton}>
          {copy.secondaryCta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default ShareRecordingExternalEmail;
