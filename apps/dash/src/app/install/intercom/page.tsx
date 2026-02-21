import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Install Intercom',
  description: 'Install Userplane via the Intercom App Store',
};

/**
 * Intercom App Store install entry point.
 * Redirects to the workspace creation page with the marketplace flow.
 * This route exists to preserve the URL configured in the Intercom App Store.
 */
export default function InstallIntercomPage() {
  redirect('/workspace/create?flow=intercom-marketplace');
}
