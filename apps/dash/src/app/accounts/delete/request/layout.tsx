import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account',
  description: 'Request permanent deletion of your account',
};

export default function DeleteAccountRequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
