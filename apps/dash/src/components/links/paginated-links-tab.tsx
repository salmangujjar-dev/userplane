'use client';

import type { Link } from '@/features/links';

import { PaginationControls } from '../shared/pagination-controls';
import { LinksList } from './links-list';

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
