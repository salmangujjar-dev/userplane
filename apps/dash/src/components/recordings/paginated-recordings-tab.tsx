'use client';

import { RecordingsGrid } from './recordings-grid';
import { PaginationControls } from '../shared/pagination-controls';

interface PaginatedRecordingsTabProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  recordingsPerPage?: number;
  recordingIds?: string[];
}

export function PaginatedRecordingsTab({
  currentPage,
  totalPages,
  onPageChange,
  recordingsPerPage = 15,
  recordingIds,
}: PaginatedRecordingsTabProps) {
  return (
    <div className="space-y-8">
      <RecordingsGrid count={recordingsPerPage} recordingIds={recordingIds} />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
