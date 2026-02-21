import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creating Workspace',
  description: 'Processing workspace creation callback',
};

export default function CreateCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
