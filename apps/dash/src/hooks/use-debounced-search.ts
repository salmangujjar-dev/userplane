import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { searchParser } from '@/lib/parsers';

export function useDebouncedSearch(key = 'search', delay = 300) {
  const [searchParam, setSearchParam] = useQueryState(key, searchParser);
  const [debouncedValue, setDebouncedValue] = useState(searchParam);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParam(debouncedValue);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [debouncedValue, delay, setSearchParam]);

  return [searchParam, setDebouncedValue] as const;
}
