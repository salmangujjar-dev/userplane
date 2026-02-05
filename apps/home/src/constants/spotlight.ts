import { mediaClient } from '../lib/media';

/**
 * Integration logo data
 */

export interface IntegrationLogo {
  src: string;
  alt: string;
}

/**
 * Integration logos for spotlight section
 * Images are served from CDN with Cloudflare Image Transforms
 */
export const INTEGRATION_LOGOS: IntegrationLogo[] = [
  { src: mediaClient.getIntegrationMediaUrl('integrations/asana.webp'), alt: 'Asana Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/clickup.webp'), alt: 'ClickUp Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/crisp.webp'), alt: 'Crisp Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/discord.webp'), alt: 'Discord Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/freshchat.webp'), alt: 'Freshchat Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/freshdesk.webp'), alt: 'Freshdesk Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/front.webp'), alt: 'Front Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/happyfox.webp'), alt: 'HappyFox Logo' },
  {
    src: mediaClient.getIntegrationMediaUrl('integrations/helpscout.webp'),
    alt: 'Help Scout Logo',
  },
  { src: mediaClient.getIntegrationMediaUrl('integrations/hiver.webp'), alt: 'Hiver Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/hubspot.webp'), alt: 'HubSpot Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/intercom.webp'), alt: 'Intercom Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/jira.webp'), alt: 'Jira Logo' },
  {
    src: mediaClient.getIntegrationMediaUrl('integrations/jiraservicedesk.webp'),
    alt: 'Jira Service Desk Logo',
  },
  { src: mediaClient.getIntegrationMediaUrl('integrations/linear.webp'), alt: 'Linear Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/make.webp'), alt: 'Make Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/n8n.webp'), alt: 'n8n Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/notion.webp'), alt: 'Notion Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/plain.webp'), alt: 'Plain Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/pylon.webp'), alt: 'Pylon Logo' },
  {
    src: mediaClient.getIntegrationMediaUrl('integrations/salesforce.webp'),
    alt: 'Salesforce Logo',
  },
  { src: mediaClient.getIntegrationMediaUrl('integrations/sentry.webp'), alt: 'Sentry Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/slack.webp'), alt: 'Slack Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/talkdesk.webp'), alt: 'Talkdesk Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/zapier.webp'), alt: 'Zapier Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/zendesk.webp'), alt: 'Zendesk Logo' },
  { src: mediaClient.getIntegrationMediaUrl('integrations/zoho.webp'), alt: 'Zoho Logo' },
];

/**
 * Spotlight image data
 * Images are served from CDN with Cloudflare Image Transforms
 */
export const SPOTLIGHT_IMAGE = {
  src: mediaClient.getSpotlightMediaUrl('spotlight/spotlight.webp'),
  alt: 'AI handling customer support calls',
};
