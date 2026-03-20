import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Install Zendesk',
  description: 'Install Userplane via the Zendesk Marketplace',
};

/**
 * Zendesk Marketplace install entry point.
 * Redirects to the workspace creation page with the marketplace flow.
 * This route exists to preserve the URL configured in the Zendesk Marketplace.
 */
export default function InstallZendeskPage() {
  redirect('/workspace/create?flow=zendesk-marketplace');
}
