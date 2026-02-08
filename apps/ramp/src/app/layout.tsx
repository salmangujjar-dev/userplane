import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppShell } from '@/components/layout/AppShell';
import { IntercomProvider } from '@/components/providers/IntercomProvider';
import { UserplaneProvider } from '@/components/providers/UserplaneProvider';
import { ToastProvider } from '@/components/ui/toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Spense - Expense Management',
  description: 'B2B expense management demo application',
  other: {
    // Userplane configuration meta tags
    'userplane:workspace': 'ws_TpaxkXdKvlnr',
    'userplane:blur': '.expense-amount, .company-name',
  },
};

// Configuration - move to env vars in production
const USERPLANE_WORKSPACE_ID = 'ws_TpaxkXdKvlnr';
const INTERCOM_APP_ID = 'z5rq51gl';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserplaneProvider workspaceId={USERPLANE_WORKSPACE_ID}>
          <IntercomProvider appId={INTERCOM_APP_ID}>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </IntercomProvider>
        </UserplaneProvider>
      </body>
    </html>
  );
}
