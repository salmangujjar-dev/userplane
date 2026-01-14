/**
 * Access Request Email Template
 * Sent to workspace owners when someone requests to join their workspace
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
} from '@react-email/components';

export interface AccessRequestEmailProps {
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  reviewUrl: string;
}

export const AccessRequestEmail = ({
  workspaceName = 'Example Workspace',
  requesterName = 'Jane Smith',
  requesterEmail = 'jane@example.com',
  reviewUrl = 'https://example.com/access-request?token=abc123',
}: AccessRequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Access Request</Heading>
            <Text style={paragraph}>
              <strong>{requesterName}</strong> ({requesterEmail}) has requested to join{' '}
              <strong>{workspaceName}</strong>.
            </Text>
            <Text style={paragraph}>
              As a workspace owner, you can review this request and approve or decline it.
            </Text>
            <Section style={buttonContainer}>
              <Button style={reviewButton} href={reviewUrl}>
                Review Request
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              This request will expire in 7 days. If you don't recognize this request, you can
              safely decline it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AccessRequestEmail;

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

const buttonContainer = {
  marginTop: '24px',
  marginBottom: '24px',
};

const reviewButton = {
  backgroundColor: '#1a1a1a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  marginTop: '20px',
  marginBottom: '20px',
};

const footer = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8898aa',
  marginTop: '16px',
};
