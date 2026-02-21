import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recording',
  description: 'View and manage a recording session',
};

export default function RecordingDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
