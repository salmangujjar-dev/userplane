/**
 * Domain - Developer Instructions Email
 * Sent with instructions to integrate Userplane SDK into a domain
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/domain/developer-instructions';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface DomainDeveloperInstructionsEmailProps {
  domainName?: string;
  settingsUrl?: string;
  docsUrl?: string;
}

export const DomainDeveloperInstructionsEmail = ({
  domainName = 'example.com',
  settingsUrl = 'https://app.userplane.io/settings/domains',
  docsUrl = 'https://docs.userplane.io/domains/integration',
}: DomainDeveloperInstructionsEmailProps) => {
  return (
    <EmailLayout preview={copy.preview(domainName)}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(domainName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](domainName)}</Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={settingsUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          <Link href={docsUrl} style={styles.link}>
            {copy.helpText}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default DomainDeveloperInstructionsEmail;
