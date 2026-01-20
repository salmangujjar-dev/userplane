/**
 * Auth - Access Request Email
 * Sent to workspace owners when someone requests to join their workspace
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/auth/access-request';
import { getUserName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

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
  const formattedWorkspaceName = getWorkspaceName(workspaceName);
  const formattedRequesterName = getUserName(requesterName);

  return (
    <EmailLayout
      preview={copy.preview(formattedRequesterName, formattedWorkspaceName)}
      showSupport={false}
    >
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>
          {copy.body[0](formattedRequesterName, requesterEmail, formattedWorkspaceName)}
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
