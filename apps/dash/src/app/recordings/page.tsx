'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import Logo from '@workspace/ui/components/logo';
import { Video, Link as LinkIcon, UserPlus } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination';
import { CreateLinkModal } from '@/components/create-link-modal';
import { ShareLinkModal } from '@/components/share-link-modal';

type TabType = 'recordings' | 'links';

export default function RecordingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('recordings');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
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
          <h1 className="text-4xl font-bold mb-2">Recents</h1>
          <p className="text-muted-foreground">Recordings from your links</p>
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
        </div>

        {activeTab === 'recordings' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="aspect-video rounded-xl bg-muted" />
              ))}
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted" />
              ))}
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
