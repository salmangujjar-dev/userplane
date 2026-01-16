/**
 * Auth - Access Request Email
 * Sent to workspace owners when someone requests to join their workspace
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/auth/access-request';

export interface AccessRequestEmailProps {
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  reviewUrl: string;
}

export const AccessRequestEmail = ({
  workspaceName,
  requesterName,
  requesterEmail,
  reviewUrl,
}: AccessRequestEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(requesterName, workspaceName)} showSupport={false}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>
          {copy.body[0](requesterName, requesterEmail, workspaceName)}
        </Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={reviewUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default AccessRequestEmail;
