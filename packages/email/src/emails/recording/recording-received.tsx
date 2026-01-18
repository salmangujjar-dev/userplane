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
  recordingTitle?: string;
  submittedAt?: string;
  duration?: string;
}

export const RecordingReceivedEmail = ({
  recordingUrl = 'https://app.userplane.io/recordings/abc123',
  recordingTitle = 'Recording from customer',
  submittedAt = 'January 15, 2025 at 2:30 PM',
  duration = '1:24',
}: RecordingReceivedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(recordingTitle)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{recordingTitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](duration, submittedAt)}</Text>
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
