/**
 * Shared email layout component
 * Canonical Userplane email structure
 */

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

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
          <Section style={styles.headerSection}>
            <Img
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0IiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDE0NCAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMTQ0IiByeD0iNDAiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik03MC40NDggMzkuNjU2QzcxLjAyNCA0MC44MDggNzEuNzYgNDIuNTA0IDcyLjY1NiA0NC43NDRDNzMuNjE2IDQ2Ljk4NCA3NC41NzYgNDkuNDE2IDc1LjUzNiA1Mi4wNEM3Ni41NiA1NC42IDc3LjQ4OCA1Ny4wNjQgNzguMzIgNTkuNDMyQzc5LjE1MiA2MS44IDc5Ljc5MiA2My42ODggODAuMjQgNjUuMDk2TDcwLjczNiA2OC40NTZDNzAuMzUyIDY2Ljk4NCA2OS43NDQgNjUuMDk2IDY4LjkxMiA2Mi43OTJDNjguMDggNjAuNDg4IDY3LjE4NCA1OC4wNTYgNjYuMjI0IDU1LjQ5NkM2NS4zMjggNTIuOTM2IDY0LjQgNTAuNTM2IDYzLjQ0IDQ4LjI5NkM2Mi41NDQgNDUuOTkyIDYxLjc3NiA0NC4xNjggNjEuMTM2IDQyLjgyNEw3MC40NDggMzkuNjU2Wk0xMTMuNjQ4IDQ2LjQ3MkMxMTMuMjY0IDQ3LjQzMiAxMTIuODggNDguNTIgMTEyLjQ5NiA0OS43MzZDMTEyLjExMiA1MC44ODggMTExLjgyNCA1MS45MTIgMTExLjYzMiA1Mi44MDhDMTEwLjY3MiA1Ni41ODQgMTA5LjQyNCA2MC42MTYgMTA3Ljg4OCA2NC45MDRDMTA2LjQxNiA2OS4xMjggMTA0LjY1NiA3My4zMiAxMDIuNjA4IDc3LjQ4QzEwMC41NiA4MS41NzYgOTguMjI0IDg1LjM4NCA5NS42IDg4LjkwNEM5Mi4yNzIgOTMuMjU2IDg4LjUyOCA5Ny4yMjQgODQuMzY4IDEwMC44MDhDODAuMjcyIDEwNC4zOTIgNzUuOTg0IDEwNy41NiA3MS41MDQgMTEwLjMxMkM2Ny4wMjQgMTEzIDYyLjQ4IDExNS4xNDQgNTcuODcyIDExNi43NDRMNDkuNTIgMTA4LjI5NkM1NCAxMDYuOTUyIDU4LjUxMiAxMDUuMTI4IDYzLjA1NiAxMDIuODI0QzY3LjYgMTAwLjQ1NiA3MS45NTIgOTcuNjA4IDc2LjExMiA5NC4yOEM4MC4zMzYgOTAuOTUyIDg0LjA0OCA4Ny4yNCA4Ny4yNDggODMuMTQ0Qzg5Ljc0NCA3OS45NDQgOTIuMDE2IDc2LjE2OCA5NC4wNjQgNzEuODE2Qzk2LjExMiA2Ny40NjQgOTcuODQgNjIuODI0IDk5LjI0OCA1Ny44OTZDMTAwLjcyIDUyLjk2OCAxMDEuNzc2IDQ4LjEwNCAxMDIuNDE2IDQzLjMwNEwxMTMuNjQ4IDQ2LjQ3MlpNNDMuNzYgNDUuNTEyQzQ0LjQgNDYuOTIgNDUuMjMyIDQ4Ljc3NiA0Ni4yNTYgNTEuMDhDNDcuMjggNTMuMzg0IDQ4LjMwNCA1NS44OCA0OS4zMjggNTguNTY4QzUwLjQxNiA2MS4xOTIgNTEuNDQgNjMuNzIgNTIuNCA2Ni4xNTJDNTMuMzYgNjguNTIgNTQuMTI4IDcwLjUwNCA1NC43MDQgNzIuMTA0TDQ1LjAwOCA3NS42NTZDNDQuNjI0IDc0LjQ0IDQ0LjA4IDcyLjkwNCA0My4zNzYgNzEuMDQ4QzQyLjczNiA2OS4xMjggNDEuOTY4IDY3LjExMiA0MS4wNzIgNjVDNDAuMjQgNjIuODI0IDM5LjM3NiA2MC42OCAzOC40OCA1OC41NjhDMzcuNTg0IDU2LjQ1NiAzNi43NTIgNTQuNTY4IDM1Ljk4NCA1Mi45MDRDMzUuMjE2IDUxLjE3NiAzNC42MDggNDkuODY0IDM0LjE2IDQ4Ljk2OEw0My43NiA0NS41MTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
              alt="Userplane"
              width={32}
              height={32}
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>Userplane</Text>
          </Section>

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
