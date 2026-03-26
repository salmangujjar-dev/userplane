import type { ActiveTabResponse } from './messaging';
import { sendMessage } from './messaging';

/**
 * Builds metadata to attach when creating a link.
 * Captures the active tab's URL as `page_url`.
 */
export async function buildLinkMeta(): Promise<Record<string, string> | undefined> {
  try {
    const response = await sendMessage<ActiveTabResponse>({ type: 'GET_ACTIVE_TAB_URL' });
    if (response?.url) {
      // TODO: Add more metadata depending on the page
      // For example, if it's a helpdesk pull the ticket ID, customer data etc.
      return { page_url: response.url };
    }
  } catch {
    // Silent failure — metadata is best-effort
  }
  return undefined;
}
