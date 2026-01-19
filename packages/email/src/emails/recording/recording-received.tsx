/**
 * Recording - Recording Received Email
 * Sent when a new recording is submitted
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/recording/recording-received';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface RecordingReceivedEmailProps {
  recordingUrl?: string;
}

export const RecordingReceivedEmail = ({
  recordingUrl = 'https://app.userplane.io/recordings/abc123',
}: RecordingReceivedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={recordingUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default RecordingReceivedEmail;
