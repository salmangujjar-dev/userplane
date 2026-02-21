import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recordings',
  description: 'View and manage received recordings',
};

export default function RecordingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
