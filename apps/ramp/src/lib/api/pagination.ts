type PaginationOptions = {
  defaultPageSize?: number;
  maxPageSize?: number;
};

type ParsedInteger = { ok: true; value: number } | { ok: false; error: string };

export type ParsedPagination =
  | { page: number; pageSize: number; error?: never }
  | { error: string; page?: never; pageSize?: never };

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): ParsedPagination {
  const defaultPageSize = options.defaultPageSize ?? 25;
  const maxPageSize = options.maxPageSize ?? 100;
  const page = parseInteger(searchParams.get('page'), 'page', 0, 0);
  const pageSize = parseInteger(searchParams.get('pageSize'), 'pageSize', defaultPageSize, 1);

  if (!page.ok) return { error: page.error };
  if (!pageSize.ok) return { error: pageSize.error };

  return {
    page: page.value,
    pageSize: Math.min(pageSize.value, maxPageSize),
  };
}

function parseInteger(
  value: string | null,
  field: string,
  fallback: number,
  minimum: number
): ParsedInteger {
  if (value == null) return { ok: true, value: fallback };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    return {
      ok: false,
      error:
        minimum > 0
          ? `${field} must be a positive integer`
          : `${field} must be a non-negative integer`,
    };
  }
  return { ok: true, value: parsed };
}
