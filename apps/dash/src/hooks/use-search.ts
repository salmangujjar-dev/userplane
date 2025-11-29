import { useQueryState } from 'nuqs';
import { searchParser } from '@/lib/parsers';

export function useSearch(key = 'search') {
  return useQueryState(key, searchParser);
}
