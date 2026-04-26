import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

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
  title: 'Ramp - Expense Management',
  description: 'Corporate spend, cards, approvals, vendors, and analytics in one Ramp workspace.',
  applicationName: 'Ramp',
  openGraph: {
    title: 'Ramp - Expense Management',
    description: 'Corporate spend, cards, approvals, vendors, and analytics in one Ramp workspace.',
    images: [
      {
        url: '/media/Ramp_Banner_3.png',
        width: 1500,
        height: 500,
        alt: 'Ramp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ramp - Expense Management',
    description: 'Corporate spend, cards, approvals, vendors, and analytics in one Ramp workspace.',
    images: ['/media/Ramp_Banner_3.png'],
  },
  other: {
    // Userplane configuration meta tags
    'userplane:workspace': 'ws_cyqt7SPbjszW',
    'userplane:blur':
      '.expense-amount, .expense-description, .employee-name, .employee-email, .company-name',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NuqsAdapter>
          <ToastProvider>{children}</ToastProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
