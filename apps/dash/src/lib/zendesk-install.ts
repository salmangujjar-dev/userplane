import { env } from '@/env';

/** URL to the Userplane app listing on the Zendesk Marketplace */
export const ZENDESK_MARKETPLACE_APP_URL = env.zendesk.marketplace.appUrl;

/** Set to true once the Zendesk Marketplace listing is approved and live */
export const ZENDESK_MARKETPLACE_LIVE = env.zendesk.marketplace.live;
