'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import Logo from '@workspace/ui/components/logo';
import { Video, Link as LinkIcon, Settings, UserPlus } from 'lucide-react';
import { CreateLinkModal } from '@/components/create-link-modal';
import { ShareLinkModal } from '@/components/share-link-modal';

type TabType = 'recordings' | 'links' | 'settings';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('recordings');
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  return (
    <div className="min-h-svh bg-background">
      <nav>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge variant="secondary" className="rounded-md">
              Starter
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <div className="h-9 w-9 rounded-full bg-muted border-2 border-background" />
              <div className="h-9 w-9 rounded-full bg-muted border-2 border-background" />
              <div className="h-9 w-9 rounded-full bg-muted border-2 border-background" />
            </div>
            <Button variant="default" size="default" className="rounded-lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
            <CreateLinkModal onLinkCreated={handleLinkCreated} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Lary&apos;s Workspace</h1>
          <p className="text-muted-foreground">Manage recording links for your workspace</p>
        </div>

        <div className="flex gap-2 mb-8">
          <Button
            variant={activeTab === 'recordings' ? 'secondary' : 'ghost'}
            size="default"
            className={`rounded-full gap-2 ${activeTab === 'recordings' ? 'bg-muted hover:bg-muted/80' : ''}`}
            onClick={() => setActiveTab('recordings')}
          >
            <Video className="h-4 w-4" />
            Recordings
          </Button>
          <Button
            variant={activeTab === 'links' ? 'secondary' : 'ghost'}
            size="default"
            className={`rounded-full gap-2 ${activeTab === 'links' ? 'bg-muted hover:bg-muted/80' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <LinkIcon className="h-4 w-4" />
            Links
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
            size="default"
            className={`rounded-full gap-2 ${activeTab === 'settings' ? 'bg-muted hover:bg-muted/80' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {activeTab === 'recordings' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Your recordings</h2>
                  <p className="text-sm text-muted-foreground">View received recordings</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => router.push('/recordings')}
                >
                  See More
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-video rounded-xl bg-muted" />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Recent recordings</h2>
                  <p className="text-sm text-muted-foreground">View recent recordings</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => router.push('/recordings')}
                >
                  See More
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-video rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Your links</h2>
                <p className="text-sm text-muted-foreground">Manage your recording links</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Overview</h2>
                <p className="text-sm text-muted-foreground">Recordings from team links</p>
              </div>
              <div className="w-full max-w-2xl h-32 rounded-xl bg-muted" />
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Plan & Usage</h2>
                <p className="text-sm text-muted-foreground">Recordings from team links</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-48 rounded-xl bg-muted" />
                <div className="h-48 rounded-xl bg-muted" />
                <div className="md:col-span-1 h-48 rounded-xl bg-muted" />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Teams</h2>
                <p className="text-sm text-muted-foreground">Manage team members</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted" />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Integrations</h2>
                <p className="text-sm text-muted-foreground">Manage workspace integrations</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted" />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Domains</h2>
                <p className="text-sm text-muted-foreground">Manage allowed domains</p>
              </div>
              <div className="w-full h-48 rounded-xl bg-muted" />
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Data</h2>
                <p className="text-sm text-muted-foreground">Manage your data and Privacy</p>
              </div>
              <div className="w-full h-48 rounded-xl bg-muted" />
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage notification preferences</p>
              </div>
              <div className="w-full h-48 rounded-xl bg-muted" />
            </div>
          </div>
        )}
      </main>

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
