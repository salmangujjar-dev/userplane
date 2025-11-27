import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';

import '@workspace/ui/globals.css';
import { Providers } from '@/components/shared/providers';
import { getAppMeta } from '@workspace/meta';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const meta = getAppMeta('dash');

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light only' } as React.CSSProperties}>
      <head>
        <meta name="color-scheme" content="light only" />
        <style
          dangerouslySetInnerHTML={{
            __html: 'html, body { color-scheme: light only !important; }',
          }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
