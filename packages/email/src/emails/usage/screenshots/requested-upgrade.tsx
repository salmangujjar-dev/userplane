/**
 * Usage Screenshots - Requested Upgrade Email
 * Sent to workspace owners when a member requests more screenshots
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/usage/screenshots/requested-upgrade';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface ScreenshotsRequestedUpgradeEmailProps {
  workspaceName?: string;
  requesterName?: string;
  billingUrl?: string;
}

export const ScreenshotsRequestedUpgradeEmail = ({
  workspaceName = 'My Workspace',
  requesterName = 'Jane Smith',
  billingUrl = 'https://app.userplane.io/billing',
}: ScreenshotsRequestedUpgradeEmailProps) => {
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

export default ScreenshotsRequestedUpgradeEmail;
