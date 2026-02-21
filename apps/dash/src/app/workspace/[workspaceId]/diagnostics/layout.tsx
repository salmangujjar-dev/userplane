import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diagnostics',
  description: 'Workspace diagnostics and maintenance tools',
};

export default function DiagnosticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
