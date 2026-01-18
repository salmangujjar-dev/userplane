/**
 * Activation - Domain Verification Required Email
 * Sent when a user needs to verify their domain to use recordings
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/activation/domain-verification-required';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface DomainVerificationRequiredEmailProps {
  domainSettingsUrl?: string;
  domainName?: string;
}

export const DomainVerificationRequiredEmail = ({
  domainSettingsUrl = 'https://app.userplane.io/settings/domains',
  domainName = 'example.com',
}: DomainVerificationRequiredEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(domainName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](domainName)}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={domainSettingsUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default DomainVerificationRequiredEmail;
