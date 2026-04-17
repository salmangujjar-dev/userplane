'use client';

import { Button } from '@userplane/ui/components/button';

import { GmailIcon, OutlookIcon } from './mail-provider-icons';

const GMAIL_URL = 'https://mail.google.com/mail/u/0/#inbox';
const OUTLOOK_URL = 'https://outlook.live.com/mail/0/inbox';

export function MailProviderButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button asChild variant="secondary" size="lg" className="w-full">
        <a href={GMAIL_URL} target="_blank" rel="noopener noreferrer">
          <GmailIcon className="h-4 w-4" />
          Open Gmail
        </a>
      </Button>
      <Button asChild variant="secondary" size="lg" className="w-full">
        <a href={OUTLOOK_URL} target="_blank" rel="noopener noreferrer">
          <OutlookIcon className="h-4 w-4" />
          Open Outlook
        </a>
      </Button>
    </div>
  );
}
