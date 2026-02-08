import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { AppShell } from '@/components/layout/AppShell';
import { IntercomProvider } from '@/components/providers/IntercomProvider';
import { type UserIdentity, UserplaneProvider } from '@/components/providers/UserplaneProvider';
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
    'userplane:blur':
      '.expense-amount, .expense-description, .employee-name, .employee-email, .company-name',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workspaceId = process.env.NEXT_PUBLIC_USERPLANE_WORKSPACE_ID!;
  const intercomAppId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID!;

  const user: UserIdentity = {
    user_id: process.env.NEXT_PUBLIC_DEMO_USER_ID!,
    user_name: process.env.NEXT_PUBLIC_DEMO_USER_NAME!,
    user_email: process.env.NEXT_PUBLIC_DEMO_USER_EMAIL!,
    user_company: process.env.NEXT_PUBLIC_DEMO_USER_COMPANY!,
    user_created_at: process.env.NEXT_PUBLIC_DEMO_USER_CREATED_AT!,
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NuqsAdapter>
          <UserplaneProvider workspaceId={workspaceId} user={user}>
            <IntercomProvider appId={intercomAppId}>
              <ToastProvider>
                <AppShell>{children}</AppShell>
              </ToastProvider>
            </IntercomProvider>
          </UserplaneProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
