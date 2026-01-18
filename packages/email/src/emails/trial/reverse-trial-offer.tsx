/**
 * Trial Reverse Trial Offer Email
 * Sent to trial users offering paid plan with refund guarantee
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/trial/reverse-trial-offer';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface TrialReverseTrialOfferEmailProps {
  upgradeUrl?: string;
  planName?: string;
  trialDays?: number;
  remainingDays?: number;
}

export const TrialReverseTrialOfferEmail = ({
  upgradeUrl = 'https://app.userplane.io/billing',
  planName = 'Starter',
  trialDays = 30,
  remainingDays = 7,
}: TrialReverseTrialOfferEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title(remainingDays)}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(trialDays)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0]}</Text>
        <Text style={styles.messageText}>{copy.body[1]}</Text>
      </Section>

      <Section style={styles.ctaSection}>
        <Link href={upgradeUrl} style={styles.ctaButton}>
          {copy.cta(planName)}
        </Link>
      </Section>
    </EmailLayout>
  );
};

export default TrialReverseTrialOfferEmail;
