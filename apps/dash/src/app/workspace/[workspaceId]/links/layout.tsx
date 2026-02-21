import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Links',
  description: 'Manage your recording links',
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
