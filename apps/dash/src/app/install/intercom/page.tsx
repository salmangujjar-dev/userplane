import { redirect } from 'next/navigation';

/**
 * Intercom App Store install entry point.
 * Redirects to the workspace creation page with the marketplace flow.
 * This route exists to preserve the URL configured in the Intercom App Store.
 */
export default function InstallIntercomPage() {
  redirect('/workspace/create?flow=intercom-marketplace');
}
