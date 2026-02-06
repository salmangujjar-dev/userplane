/**
 * Billing - Plan Change Request Email
 * Sent to workspace owners when a team member requests a plan upgrade/downgrade
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/billing/plan-change-request';
import { getRequesterName, getWorkspaceName } from '../../shared/fallback';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface PlanChangeRequestEmailProps {
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  planName: string;
  billingUrl: string;
  customMessage?: string;
  logoUrl?: string;
}

export const PlanChangeRequestEmail = ({
  workspaceName,
  requesterName,
  requesterEmail,
  planName,
  billingUrl,
  customMessage,
  logoUrl,
}: PlanChangeRequestEmailProps) => {
  const formattedWorkspaceName = getWorkspaceName(workspaceName);
  const formattedRequesterName = getRequesterName(requesterName, requesterEmail);

  return (
    <EmailLayout preview={copy.preview(formattedRequesterName, planName)} logoUrl={logoUrl}>
      <Text style={styles.title}>{copy.title}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>
          {copy.body[0](formattedRequesterName, formattedWorkspaceName, planName)}
        </Text>
        {customMessage && <Text style={styles.messageText}>{copy.body[1](customMessage)}</Text>}
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={billingUrl} style={styles.ctaButton}>
          {copy.cta}
        </Link>
      </Section>

      <Section style={styles.messageSection}>
        <Text style={styles.smallText}>{copy.footer}</Text>
      </Section>
    </EmailLayout>
  );
};

export default PlanChangeRequestEmail;
