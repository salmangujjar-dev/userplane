import { BILLING_CADENCES } from '@workspace/pricing';
import { pgEnum } from 'drizzle-orm/pg-core';

export const billingCadenceEnum = pgEnum('billing_cadence', BILLING_CADENCES);
