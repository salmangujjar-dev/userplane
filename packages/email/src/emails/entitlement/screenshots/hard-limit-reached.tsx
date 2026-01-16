/**
 * Entitlement Screenshots - Hard Limit Reached Email
 * Sent when a workspace has reached its screenshot limit
 */

import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';
import { copy } from '../../../copy/entitlement/screenshots/hard-limit-reached';

export interface ScreenshotsHardLimitEmailProps {
  workspaceName?: string;
  totalScreenshots?: number;
  upgradeUrl?: string;
}

export const ScreenshotsHardLimitEmail = ({
  workspaceName = 'My Workspace',
  totalScreenshots = 100,
  upgradeUrl = 'https://app.userplane.io/billing',
}: ScreenshotsHardLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(totalScreenshots)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={upgradeUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default ScreenshotsHardLimitEmail;
