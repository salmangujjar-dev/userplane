/**
 * Shared email layout component
 * Canonical Userplane email structure
 */

import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import * as styles from './styles';

export interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  showSupport?: boolean;
  ps?: string;
}

export const EmailLayout = ({ preview, children, showSupport = true, ps }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Text style={styles.logoText}>Userplane</Text>

          {children}

          {ps && <Text style={styles.psText}>PS: {ps}</Text>}

          <Hr style={styles.divider} />

          {showSupport && (
            <Section style={styles.supportSection}>
              <Text style={styles.supportText}>
                Questions?{' '}
                <Link href="mailto:support@userplane.io" style={styles.supportLink}>
                  support@userplane.io
                </Link>
              </Text>
            </Section>
          )}

          <Text style={styles.footer}>Userplane Inc</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailLayout;
