'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination';
import { Plus } from 'lucide-react';

import type { WorkspaceDomain } from '@/types';

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
  canDelete?: boolean;
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
  canDelete = true,
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
          canDelete={canDelete}
        />
      ))}

      <button
        onClick={onAddDomain}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors cursor-pointer hover:border-primary/50"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Set up another domain</span>
      </button>

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

interface PageNumberItemProps {
  page: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PageNumberItem({ page, currentPage, totalPages, onPageChange }: PageNumberItemProps) {
  // Show first page, last page, and pages around current page
  if (
    page === 1 ||
    page === totalPages ||
    (page >= currentPage - 1 && page <= currentPage + 1)
  ) {
    return (
      <PaginationItem>
        <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page}>
          {page}
        </PaginationLink>
      </PaginationItem>
    );
  }

  // Show ellipsis for gaps
  if (page === currentPage - 2 || page === currentPage + 2) {
    return (
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
    );
  }

  return null;
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
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PageNumberItem
            key={page}
            page={page}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        ))}

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
