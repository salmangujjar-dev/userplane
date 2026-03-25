import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Userplane account',
  robots: { index: false, follow: false },
};

export default function ReviewChromeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
