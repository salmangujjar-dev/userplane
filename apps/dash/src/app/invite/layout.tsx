import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workspace Invite',
  description: 'Accept an invitation to join a workspace',
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
