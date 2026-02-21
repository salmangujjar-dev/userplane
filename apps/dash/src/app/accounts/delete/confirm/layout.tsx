import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirm Account Deletion',
  description: 'Confirm the permanent deletion of your account',
};

export default function DeleteAccountConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
