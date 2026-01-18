/**
 * Entitlement Screenshots - Soft Limit Reached Email
 * Sent when a workspace is approaching its screenshot limit
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/entitlement/screenshots/soft-limit-reached';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface ScreenshotsSoftLimitEmailProps {
  workspaceName?: string;
  usedScreenshots?: number;
  totalScreenshots?: number;
  upgradeUrl?: string;
}

export const ScreenshotsSoftLimitEmail = ({
  workspaceName = 'My Workspace',
  usedScreenshots = 90,
  totalScreenshots = 100,
  upgradeUrl = 'https://app.userplane.io/billing',
}: ScreenshotsSoftLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(usedScreenshots, totalScreenshots)}</Text>

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

export default ScreenshotsSoftLimitEmail;
