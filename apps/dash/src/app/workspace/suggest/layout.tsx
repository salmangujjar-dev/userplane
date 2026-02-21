import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suggested Workspaces',
  description: 'Join an existing workspace or create a new one',
};

export default function WorkspaceSuggestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
