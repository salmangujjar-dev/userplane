import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirecting',
  description: 'Redirecting to your workspace',
};

export default function CatchAllLayout({ children }: { children: React.ReactNode }) {
  return children;
}
