/**
 * Subject for Billing - Plan Change Request Email
 */

export const subject = (requesterName: string, planName: string) =>
  `${requesterName} is requesting to upgrade to ${planName}`;
