/**
 * Integration logo data
 */
import { mediaClient } from '../../lib/media';

export interface IntegrationLogo {
  src: string;
  alt: string;
}

/**
 * Integration logos for spotlight section
 */
export const INTEGRATION_LOGOS: IntegrationLogo[] = [
  { src: mediaClient.integrations.get('asana'), alt: 'Asana Logo' },
  { src: mediaClient.integrations.get('clickup'), alt: 'ClickUp Logo' },
  { src: mediaClient.integrations.get('crisp'), alt: 'Crisp Logo' },
  { src: mediaClient.integrations.get('discord'), alt: 'Discord Logo' },
  { src: mediaClient.integrations.get('freshchat'), alt: 'Freshchat Logo' },
  { src: mediaClient.integrations.get('freshdesk'), alt: 'Freshdesk Logo' },
  { src: mediaClient.integrations.get('front'), alt: 'Front Logo' },
  { src: mediaClient.integrations.get('happyfox'), alt: 'HappyFox Logo' },
  { src: mediaClient.integrations.get('helpscout'), alt: 'Help Scout Logo' },
  { src: mediaClient.integrations.get('hiver'), alt: 'Hiver Logo' },
  { src: mediaClient.integrations.get('hubspot'), alt: 'HubSpot Logo' },
  { src: mediaClient.integrations.get('intercom'), alt: 'Intercom Logo' },
  { src: mediaClient.integrations.get('jira'), alt: 'Jira Logo' },
  { src: mediaClient.integrations.get('jiraservicedesk'), alt: 'Jira Service Desk Logo' },
  { src: mediaClient.integrations.get('linear'), alt: 'Linear Logo' },
  { src: mediaClient.integrations.get('make'), alt: 'Make Logo' },
  { src: mediaClient.integrations.get('n8n'), alt: 'n8n Logo' },
  { src: mediaClient.integrations.get('notion'), alt: 'Notion Logo' },
  { src: mediaClient.integrations.get('plain'), alt: 'Plain Logo' },
  { src: mediaClient.integrations.get('pylon'), alt: 'Pylon Logo' },
  { src: mediaClient.integrations.get('salesforce'), alt: 'Salesforce Logo' },
  { src: mediaClient.integrations.get('sentry'), alt: 'Sentry Logo' },
  { src: mediaClient.integrations.get('slack'), alt: 'Slack Logo' },
  { src: mediaClient.integrations.get('talkdesk'), alt: 'Talkdesk Logo' },
  { src: mediaClient.integrations.get('zapier'), alt: 'Zapier Logo' },
  { src: mediaClient.integrations.get('zendesk'), alt: 'Zendesk Logo' },
  { src: mediaClient.integrations.get('zoho'), alt: 'Zoho Logo' },
];

/**
 * Spotlight image data
 */
export const SPOTLIGHT_IMAGE = {
  src: '/images/spotlight/spotlight.webp',
  alt: 'AI handling customer support calls',
};
