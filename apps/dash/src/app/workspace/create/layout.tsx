import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Workspace',
  description: 'Create a new workspace to get started',
};

export default function CreateWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
