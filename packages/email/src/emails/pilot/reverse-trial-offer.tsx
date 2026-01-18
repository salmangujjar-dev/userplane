/**
 * Pilot Reverse Trial Offer Email
 * Sent to pilot users offering them a paid trial with money-back guarantee
 */

import { Link, Section, Text } from '@react-email/components';
import * as React from 'react';

import { copy } from '../../copy/pilot/reverse-trial-offer';
import { EmailLayout } from '../../shared/layout';
import * as styles from '../../shared/styles';

export interface ReverseTrialOfferEmailProps {
  upgradeUrl?: string;
  planName?: string;
  trialDays?: number;
}

export const ReverseTrialOfferEmail = ({
  upgradeUrl = 'https://app.userplane.io/billing',
  planName = 'Starter',
  trialDays = 30,
}: ReverseTrialOfferEmailProps) => {
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle(trialDays, planName)}</Text>

      <Section style={styles.messageSection}>
        <Text style={styles.messageText}>{copy.body[0](planName, trialDays)}</Text>
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

export default ReverseTrialOfferEmail;
