'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@workspace/ui/components/pagination';
import type { WorkspaceDomain } from '@/hooks/use-workspace-domains';
import { DomainListItem } from './domain-list-item';

interface DomainListProps {
  domains: WorkspaceDomain[];
  onConfigure: (
    domainId: string,
    domainUrl: string,
    status: WorkspaceDomain['domainStatus']
  ) => void;
  onEdit: (domainId: string, domainUrl: string) => void;
  onDelete: (domainId: string, domainUrl: string) => void;
  onAddDomain: () => void;
  loadingConfigureId: string | null;
  isDeleteDisabled: boolean;
  // Pagination props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Renders the list of domains with pagination
 */
export function DomainList({
  domains,
  onConfigure,
  onEdit,
  onDelete,
  onAddDomain,
  loadingConfigureId,
  isDeleteDisabled,
  currentPage,
  totalPages,
  onPageChange,
}: DomainListProps) {
  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <DomainListItem
          key={domain.domainId}
          domain={domain}
          onConfigure={onConfigure}
          onEdit={onEdit}
          onDelete={onDelete}
          isConfiguring={loadingConfigureId === domain.domainId}
          isDeleteDisabled={isDeleteDisabled}
        />
      ))}

      <Button variant="outline" className="w-full" onClick={onAddDomain}>
        Set up another domain
      </Button>

      {totalPages > 1 && (
        <DomainListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

interface DomainListPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for the domain list
 */
function DomainListPagination({
  currentPage,
  totalPages,
  onPageChange,
}: DomainListPaginationProps) {
  const renderPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
      // Show first page, last page, and pages around current page
      if (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1)
      ) {
        return (
          <PaginationItem key={page}>
            <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page}>
              {page}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis for gaps
      if (page === currentPage - 2 || page === currentPage + 2) {
        return (
          <PaginationItem key={page}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      return null;
    });
  };

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {renderPageNumbers()}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
