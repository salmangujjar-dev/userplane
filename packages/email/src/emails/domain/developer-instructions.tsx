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
  domainUrl: string;
  verificationUrl: string;
  userName?: string;
  logoUrl?: string;
}

export const DomainDeveloperInstructionsEmail = ({
  domainUrl,
  verificationUrl,
  userName,
  logoUrl,
}: DomainDeveloperInstructionsEmailProps) => {
  const greeting = copy.greeting(userName, domainUrl);

  return (
    <EmailLayout preview={copy.preview} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>
          {greeting.prefix}
          <Link href={verificationUrl} style={styles.link}>
            {greeting.linkText}
          </Link>
          {greeting.suffix}
        </Text>
        <Text style={styles.messageText}>{copy.body}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={verificationUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>
          <Link href={verificationUrl} style={styles.link}>
            {copy.fallbackText}
          </Link>
        </Text>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default DomainDeveloperInstructionsEmail;
