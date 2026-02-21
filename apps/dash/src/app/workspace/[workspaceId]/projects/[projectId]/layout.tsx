import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project',
  description: 'Manage recordings and links for this project',
};

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
