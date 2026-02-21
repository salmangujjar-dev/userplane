import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Domain Setup',
  description: 'Install the Userplane code snippet on your domain',
};

export default function DomainSetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
