/**
 * Shared email layout component
 * Canonical Userplane email structure
 */

import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { SUPPORT_EMAIL, SUPPORT_EMAIL_MAILTO } from '@workspace/shared';
import { ASSET_MANIFEST, DEFAULT_CDN_DOMAIN } from '@workspace/storage/media';
import * as React from 'react';

import * as styles from './styles';

// Raw CDN URL for the email logo -- used as the default when no logoUrl prop is provided.
// Skips Cloudflare Image Transforms intentionally because email clients
// need a direct image URL and may not support WebP/AVIF from format=auto.
const DEFAULT_EMAIL_LOGO_URL = `${DEFAULT_CDN_DOMAIN}/${ASSET_MANIFEST['brand/userplane-icon-64.png']}`;

export interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  showSupport?: boolean;
  ps?: string;
  logoUrl?: string;
}

export const EmailLayout = ({
  preview,
  children,
  showSupport = true,
  ps,
  logoUrl,
}: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.headerSection}>
            <Row style={styles.logoRow}>
              <Column style={styles.logoImageColumn}>
                <Img
                  src={logoUrl || DEFAULT_EMAIL_LOGO_URL}
                  alt="Userplane"
                  width={32}
                  height={32}
                />
              </Column>
              <Column style={styles.logoTextColumn}>
                <Text style={styles.logoText}>Userplane</Text>
              </Column>
            </Row>
          </Section>

          {children}

          {ps && <Text style={styles.psText}>PS: {ps}</Text>}

          <Hr style={styles.divider} />

          {showSupport && (
            <Section style={styles.supportSection}>
              <Text style={styles.supportText}>
                Questions?{' '}
                <Link href={SUPPORT_EMAIL_MAILTO} style={styles.supportLink}>
                  {SUPPORT_EMAIL}
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
