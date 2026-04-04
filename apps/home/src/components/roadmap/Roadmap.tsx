import { useState } from 'react';

import type { RoadmapProps } from '@/types/roadmap';

export type { RoadmapProps };

interface RoadmapComponentProps {
  items: RoadmapProps[];
}

const ITEMS_PER_PAGE = 7;

const RoadmapComponent = ({ items }: RoadmapComponentProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: RoadmapProps['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Completed
          </span>
        );
      case 'inProgress':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            In Progress
          </span>
        );
      case 'notStarted':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Not Started
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Planned
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-left">
      <div className="flex flex-col gap-6">
        {paginatedItems.map((item, index) => (
          <div key={currentPage * ITEMS_PER_PAGE + index} className="flex flex-col gap-2 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(item.status)}
                <h3 className="font-medium text-lg">{item.title}</h3>
              </div>
              {item.date && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {item.date}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={`page-${i}`}
                onClick={() => setCurrentPage(i)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  i === currentPage ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export { RoadmapComponent };
