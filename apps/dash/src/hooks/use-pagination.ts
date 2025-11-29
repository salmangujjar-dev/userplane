import { useQueryState } from 'nuqs';
import { pageParser } from '@/lib/parsers';

export function usePagination(key = 'page') {
  return useQueryState(key, pageParser);
}
