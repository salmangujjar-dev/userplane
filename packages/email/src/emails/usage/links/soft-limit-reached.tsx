/**
 * Usage Links - Soft Limit Reached Email
 * Sent when a workspace is approaching its links limit
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../../copy/usage/links/soft-limit-reached';
import { EmailLayout } from '../../../shared/layout';
import * as styles from '../../../shared/styles';

export interface LinksSoftLimitEmailProps {
  workspaceName?: string;
  usedLinks?: number;
  totalLinks?: number;
  upgradeUrl?: string;
}

export const LinksSoftLimitEmail = ({
  workspaceName = 'My Workspace',
  usedLinks = 80,
  totalLinks = 100,
  upgradeUrl = 'https://app.userplane.io/billing',
}: LinksSoftLimitEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(workspaceName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(usedLinks, totalLinks)}</Text>

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

export default LinksSoftLimitEmail;
