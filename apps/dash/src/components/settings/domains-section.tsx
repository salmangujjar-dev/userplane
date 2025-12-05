'use client';

import { useState, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@workspace/ui/components/pagination';
import { ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DomainVerificationPreModal } from '@/components/modals/domain-verification-pre-modal';
import { DomainVerificationVerifyingModal } from '@/components/modals/domain-verification-verifying-modal';
import { DomainVerificationPostModal } from '@/components/modals/domain-verification-post-modal';
import { EditDomainModal } from '@/components/modals/edit-domain-modal';
import { CreateDomainModal } from '@/components/modals/create-domain-modal';

const DOMAINS = [
  { id: 1, url: 'localhost:5500/', status: 'Installed', verified: true },
  { id: 2, url: 'app.userplane.io', status: 'Pending', verified: false },
  { id: 3, url: 'staging.userplane.io/dashboard', status: 'Installed', verified: true },
  { id: 4, url: 'dev.userplane.io', status: 'Installed', verified: true },
  { id: 5, url: 'localhost:3000/app', status: 'Pending', verified: false },
  { id: 6, url: 'beta.userplane.io/portal', status: 'Installed', verified: true },
  { id: 7, url: 'testing.userplane.io', status: 'Pending', verified: false },
  { id: 8, url: 'production.userplane.io', status: 'Installed', verified: true },
];

type VerificationStep = 'pre' | 'verifying' | 'post' | null;

const ITEMS_PER_PAGE = 5;

export function DomainsSection() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(null);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(DOMAINS.length / ITEMS_PER_PAGE);

  const paginatedDomains = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return DOMAINS.slice(startIndex, endIndex);
  }, [currentPage]);

  const handleCreateDomain = (domainUrl: string) => {
    console.log('Adding domain:', domainUrl);
  };

  const handleVerify = (domainUrl: string) => {
    setVerifyingDomain(domainUrl);
    setVerificationStep('pre');
  };

  const handleShowVerified = (domainUrl: string) => {
    setVerifyingDomain(domainUrl);
    setVerificationStep('post');
  };

  const handleStartVerification = async () => {
    setVerificationStep('verifying');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setVerificationStep('post');
  };

  const handleCloseModals = () => {
    setVerifyingDomain(null);
    setVerificationStep(null);
  };

  const handleReverify = () => {
    setVerificationStep('pre');
  };

  const handleEditDomain = (domainUrl: string) => {
    setEditingDomain(domainUrl);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (newDomainUrl: string) => {
    console.log('Editing domain from:', editingDomain, 'to:', newDomainUrl);
  };

  const handleDeleteDomain = (domainUrl: string) => {
    console.log('Deleting domain:', domainUrl);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Domains</h2>
        <p className="text-sm text-muted-foreground">Manage allowed domains for recordings</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {paginatedDomains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${domain.verified ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
              <span className="text-sm">
                {domain.url.includes('/') ? (
                  <>
                    <span className="text-foreground">{domain.url.split('/')[0]}/</span>
                    <span className="text-muted-foreground">
                      {domain.url.split('/').slice(1).join('/')}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground">{domain.url}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {domain.verified ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                  onClick={() => handleShowVerified(domain.url)}
                >
                  Verified
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                  onClick={() => handleVerify(domain.url)}
                >
                  Verify
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditDomain(domain.url)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Domain
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteDomain(domain.url)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Domain
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full max-w-2xl"
          onClick={() => setShowCreateModal(true)}
        >
          Set up another domain
        </Button>

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <DomainVerificationPreModal
        open={verificationStep === 'pre'}
        onOpenChange={handleCloseModals}
        domainUrl={verifyingDomain || ''}
        onVerify={handleStartVerification}
      />

      <DomainVerificationVerifyingModal
        open={verificationStep === 'verifying'}
        onOpenChange={handleCloseModals}
      />

      <DomainVerificationPostModal
        open={verificationStep === 'post'}
        onOpenChange={handleCloseModals}
        domainUrl={verifyingDomain || ''}
        onReverify={handleReverify}
      />

      <CreateDomainModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateDomain={handleCreateDomain}
      />

      <EditDomainModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        domainUrl={editingDomain || ''}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
