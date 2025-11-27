'use client';

import { LinksList } from './links-list';
import { PaginationControls } from '../shared/pagination-controls';

interface PaginatedLinksTabProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  linksPerPage?: number;
  linkIds?: string[];
}

export function PaginatedLinksTab({
  currentPage,
  totalPages,
  onPageChange,
  linksPerPage = 10,
  linkIds,
}: PaginatedLinksTabProps) {
  return (
    <div className="space-y-8">
      <LinksList count={linksPerPage} linkIds={linkIds} />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
