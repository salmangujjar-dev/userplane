/**
 * Workspace - Access Requested Email
 * Sent to workspace owners when someone requests access
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';
import { copy } from '../../copy/workspace/access-requested';

export interface AccessRequestedEmailProps {
  workspaceName?: string;
  requesterName?: string;
  requesterEmail?: string;
  reviewUrl?: string;
}

export const AccessRequestedEmail = ({
  workspaceName = 'My Workspace',
  requesterName = 'Jane Smith',
  requesterEmail = 'jane@example.com',
  reviewUrl = 'https://app.userplane.io/settings/members',
}: AccessRequestedEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(requesterName, workspaceName)} ps={copy.ps}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(requesterName, workspaceName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](requesterName, requesterEmail)}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={reviewUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default AccessRequestedEmail;
