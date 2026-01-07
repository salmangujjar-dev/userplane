import { useState, useEffect, useRef } from 'react';
import type { FilterState, BatchOption } from '../types';
import './Sidebar.css';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

function generateBatches(): BatchOption[] {
  const batches: BatchOption[] = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  for (let year = currentYear; year >= 2005; year--) {
    const shortYear = String(year).slice(-2);

    // Spring batch (new in 2026)
    if (year >= 2026) {
      batches.push({ label: `Spring ${year}`, value: `X${shortYear}` });
    }

    // Fall batch (started in 2024)
    if (year >= 2024) {
      batches.push({ label: `Fall ${year}`, value: `F${shortYear}` });
    }

    // Summer batch (skip if current year and before June)
    if (year !== currentYear || currentMonth >= 5) {
      batches.push({ label: `Summer ${year}`, value: `S${shortYear}` });
    }

    // Winter batch (skip for 2005)
    if (year !== 2005) {
      batches.push({ label: `Winter ${year}`, value: `W${shortYear}` });
    }
  }

  return batches;
}

export default function Sidebar({ filters, onFilterChange }: SidebarProps) {
  const [showAllBatches, setShowAllBatches] = useState(false);
  const [localIsHiring, setLocalIsHiring] = useState(filters.isHiring);
  const [localBatch, setLocalBatch] = useState(filters.batch);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const batches = generateBatches();
  const visibleBatches = showAllBatches ? batches : batches.slice(0, 8);

  // Sync local state with props
  useEffect(() => {
    setLocalIsHiring(filters.isHiring);
    setLocalBatch(filters.batch);
  }, [filters.isHiring, filters.batch]);

  // Debounced filter change
  const debouncedFilterChange = (newFilters: Partial<FilterState>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onFilterChange({ ...newFilters, page: 0 });
    }, 300);
  };

  const handleIsHiringChange = () => {
    const newValue = !localIsHiring;
    setLocalIsHiring(newValue);
    debouncedFilterChange({ isHiring: newValue });
  };

  const handleBatchChange = (batchValue: string | null) => {
    // If clicking the already selected batch, unselect it (go to All batches)
    const newValue = localBatch === batchValue ? null : batchValue;
    setLocalBatch(newValue);
    debouncedFilterChange({ batch: newValue });
  };

  return (
    <aside className="sidebar">
      {/* Quick Filters */}
      <div className="filter-section">
        <label className="filter-checkbox">
          <input type="checkbox" checked={localIsHiring} onChange={handleIsHiringChange} />
          <span className="checkbox-label">Is Hiring</span>
        </label>
      </div>

      <div className="filter-divider" />

      {/* Batch Filter */}
      <div className="filter-section">
        <h3 className="filter-title">Batch</h3>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={localBatch === null}
            onChange={() => handleBatchChange(null)}
          />
          <span className="checkbox-label">All batches</span>
        </label>

        {visibleBatches.map((batch) => (
          <label key={batch.value} className="filter-checkbox">
            <input
              type="checkbox"
              checked={localBatch === batch.value}
              onChange={() => handleBatchChange(batch.value)}
            />
            <span className="checkbox-label">{batch.label}</span>
          </label>
        ))}

        {batches.length > 8 && (
          <button className="see-all-btn" onClick={() => setShowAllBatches(!showAllBatches)}>
            {showAllBatches ? 'Show less' : 'See all options'}
          </button>
        )}
      </div>
    </aside>
  );
}
