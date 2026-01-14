/**
 * Email Verification Template
 * Sent when a user needs to verify their email address
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

export interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
}

export const EmailVerificationEmail = ({
  userName = 'there',
  verificationUrl = 'https://example.com/verify?token=abc123',
}: EmailVerificationProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Verify your email</Heading>
            <Text style={paragraph}>
              Hi <strong>{userName}</strong>,
            </Text>
            <Text style={paragraph}>
              Thanks for signing up! Please verify your email address to complete your registration
              and get started.
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
            <Hr style={hr} />
            <Text style={smallText}>Or copy and paste this URL into your browser:</Text>
            <Text style={linkText}>
              <Link href={verificationUrl} style={link}>
                {verificationUrl}
              </Link>
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              If you didn't create an account, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailVerificationEmail;

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
