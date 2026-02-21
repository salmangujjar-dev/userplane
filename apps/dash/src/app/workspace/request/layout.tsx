import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Request',
  description: 'Review and manage workspace access requests',
};

export default function AccessRequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
