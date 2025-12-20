'use client';

import { LinksList } from './links-list';
import { PaginationControls } from '../shared/pagination-controls';
import type { Link } from '@/hooks/use-workspace-links';

interface PaginatedLinksTabProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  links?: Link[];
  isLoading?: boolean;
}

export function PaginatedLinksTab({
  currentPage,
  totalPages,
  onPageChange,
  links,
  isLoading,
}: PaginatedLinksTabProps) {
  return (
    <div className="space-y-8">
      <LinksList links={links} isLoading={isLoading} />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
