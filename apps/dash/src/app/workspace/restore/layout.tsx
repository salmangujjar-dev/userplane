import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restore Workspace',
  description: 'Restore a previously deleted workspace or project',
};

export default function RestoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
