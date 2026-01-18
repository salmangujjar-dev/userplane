/**
 * Entitlement Recordings - Requested Upgrade Email
 * Sent to workspace owners when a member requests more recording minutes
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/entitlement/recordings/requested-upgrade';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface RecordingsRequestedUpgradeEmailProps {
  workspaceName?: string;
  requesterName?: string;
  billingUrl?: string;
}

export const RecordingsRequestedUpgradeEmail = ({
  workspaceName = 'My Workspace',
  requesterName = 'Jane Smith',
  billingUrl = 'https://app.userplane.io/billing',
}: RecordingsRequestedUpgradeEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(requesterName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(requesterName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](workspaceName)}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={billingUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default RecordingsRequestedUpgradeEmail;
