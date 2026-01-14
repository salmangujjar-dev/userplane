/**
 * Magic Link Email Template
 * Sent when a user requests passwordless sign in
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Heading,
  Link,
} from '@react-email/components';

export interface MagicLinkEmailProps {
  magicLinkUrl: string;
}

export const MagicLinkEmail = ({
  magicLinkUrl = 'https://example.com/auth/magic?token=abc123',
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Sign in to Userplane</Heading>
            <Text style={paragraph}>
              Click the button below to securely sign in to your account. This link will expire in
              10 minutes.
            </Text>
            <Button style={button} href={magicLinkUrl}>
              Sign In
            </Button>
            <Hr style={hr} />
            <Text style={smallText}>Or copy and paste this URL into your browser:</Text>
            <Text style={linkText}>
              <Link href={magicLinkUrl} style={link}>
                {magicLinkUrl}
              </Link>
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              If you didn't request this email, you can safely ignore it. Someone may have typed
              your email address by mistake.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MagicLinkEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
  marginBottom: '24px',
  color: '#1a1a1a',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#404040',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  marginTop: '24px',
  marginBottom: '24px',
};

const hr = {
  borderColor: '#e6ebf1',
  marginTop: '20px',
  marginBottom: '20px',
};

const smallText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6c757d',
  marginBottom: '8px',
};

const linkText = {
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '16px',
};

const link = {
  color: '#007bff',
  textDecoration: 'underline',
};

const footer = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8898aa',
  marginTop: '16px',
};
