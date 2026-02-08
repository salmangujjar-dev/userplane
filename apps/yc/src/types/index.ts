export interface Company {
  id: number;
  name: string;
  slug: string;
  website: string;
  smallLogoUrl?: string;
  oneLiner: string;
  longDescription: string;
  teamSize: number;
  url: string;
  batch: string;
  tags: string[];
  status: string;
  industries: string[];
  regions: string[];
  locations: string[];
  badges: string[];
}

export interface SearchResult {
  companies: Company[];
  nextPage?: string;
  page: number;
  totalPages: number;
}

export interface FilterState {
  query: string;
  batch: string | null;
  isHiring: boolean;
  page: number;
}

export interface BatchOption {
  label: string;
  value: string;
  count?: number;
}

export type SortOption = 'default' | 'newest' | 'oldest' | 'team_size';
