/**
 * Highlight Recordings - Request Console Logs Email
 * Educate users about capturing console logs with recordings
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/highlight/recordings/request-console-logs';

export interface RequestConsoleLogsEmailProps {
  settingsUrl?: string;
  docsUrl?: string;
}

export const RequestConsoleLogsEmail = ({
  settingsUrl = 'https://app.userplane.io/settings/domains',
  docsUrl = 'https://docs.userplane.io/recordings/console-logs',
}: RequestConsoleLogsEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={settingsUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default RequestConsoleLogsEmail;
