import '@/styles/global.css';

import { getAppMeta } from '@userplane/shared/meta';
import type { Metadata } from 'next';

import { PostHogInit } from '@/posthog/PostHogInit';

const meta = getAppMeta('recorder');

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  icons: {
    icon: meta.favicon,
  },
  openGraph: {
    title: meta.title,
    description: meta.description,
    locale: meta.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PostHogInit />
      {children}
    </>
  );
}
