/**
 * Workspace - Access Request Email
 * Sent to workspace owners when someone requests to join their workspace
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/workspace/access-request';
import { getRequesterName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface AccessRequestEmailProps {
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  reviewUrl: string;
  expiryDate: string;
}

export const AccessRequestEmail = ({
  workspaceName,
  requesterName,
  requesterEmail,
  reviewUrl,
  expiryDate,
}: AccessRequestEmailProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);
  const formattedRequesterName = getRequesterName(requesterName, requesterEmail);

  return (
    <EmailLayout
      preview={copy.preview(formattedRequesterName, formattedWorkspaceName)}
      showSupport={false}
    >
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>
          {copy.body[0](formattedRequesterName, formattedWorkspaceName)}
        </Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={reviewUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer(expiryDate)}</Text>
      </Section>
    </EmailLayout>
  );
};

export default AccessRequestEmail;
