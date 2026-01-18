import './CompanyDirectory.css';

import { useCallback, useEffect, useRef, useState } from 'react';

import { isEnabled } from '../flags';
import type { Company, FilterState, SearchResult } from '../types';
import CompanyCard from './CompanyCard';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';

const API_BASE_URL = 'https://api.ycombinator.com/v0.1/companies';

function buildApiUrl(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set('q', filters.query);
  }

  if (filters.batch) {
    params.set('batch', filters.batch);
  }

  // API uses 1-indexed pages
  params.set('page', String(filters.page + 1));

  const queryString = params.toString();
  return `${API_BASE_URL}?${queryString}`;
}

function filterCompanies(companies: Company[], filters: FilterState): Company[] {
  return companies.filter((company) => {
    if (filters.isHiring && !company.badges.includes('isHiring')) {
      return false;
    }
    return true;
  });
}

export default function CompanyDirectory() {
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    batch: null,
    isHiring: false,
    page: 0,
  });

  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(filters);
  const [data, setData] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce filter changes (except page changes which should be immediate)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Page changes are immediate
    if (filters.page !== debouncedFilters.page) {
      setDebouncedFilters(filters);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, debouncedFilters.page]);

  const fetchCompanies = useCallback(async (filters: FilterState) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildApiUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SearchResult = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when debounced filters change
  useEffect(() => {
    fetchCompanies(debouncedFilters);
  }, [debouncedFilters, fetchCompanies]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query, page: 0 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page: page - 1 })); // Convert to 0-indexed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Apply client-side filters
  const filteredCompanies = data ? filterCompanies(data.companies, debouncedFilters) : [];
  const totalCount = filteredCompanies.length;
  const totalCompanies = data?.totalPages ? data.totalPages * 30 : 0;

  return (
    <div className="directory">
      <div className="directory-content">
        {isEnabled('sidebar') && <Sidebar filters={filters} onFilterChange={handleFilterChange} />}

        <main className="directory-main">
          {isEnabled('search') && (
            <div className="search-wrapper">
              <SearchBar
                value={filters.query}
                onChange={handleSearchChange}
                placeholder="Search..."
              />
            </div>
          )}

          {isEnabled('resultsCount') && (
            <div className="results-info">
              {isLoading ? (
                <span className="results-count">Loading...</span>
              ) : error ? (
                <span className="results-count error">Error: {error}</span>
              ) : (
                <span className="results-count">
                  Showing {totalCount} of{' '}
                  {totalCompanies > 0 ? `${totalCompanies.toLocaleString()}+` : '1,000+'} companies
                </span>
              )}
            </div>
          )}

          <div className="company-list">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="company-skeleton">
                  <div className="skeleton skeleton-logo" />
                  <div className="skeleton-content">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-tags" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="error-message">
                <p>Failed to load companies. Please try again.</p>
                <button onClick={() => fetchCompanies(debouncedFilters)} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="no-results">
                <p>No companies found matching your criteria.</p>
              </div>
            ) : (
              filteredCompanies.map((company) => <CompanyCard key={company.id} company={company} />)
            )}
          </div>

          {isEnabled('pagination') && data && data.totalPages > 1 && !isLoading && !error && (
            <Pagination
              currentPage={debouncedFilters.page + 1}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
