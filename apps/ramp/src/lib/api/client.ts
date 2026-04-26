import { log } from '@/lib/client-logger';
import { isFailureActive } from '@/lib/feature-flags';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const fullUrl = `${BASE_URL}${url}`;
  log.debug({ method, url: fullUrl }, 'api request');

  // Network error simulation: 20% chance of TypeError
  if (isFailureActive('networkErrorSimulation') && Math.random() < 0.2) {
    log.error(
      { method, url: fullUrl, injectedError: 'network_drop' },
      'chaos: simulated network failure'
    );
    throw new TypeError('Failed to fetch');
  }

  const start = performance.now();
  const res = await fetch(fullUrl, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const durationMs = Math.round(performance.now() - start);

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    log.error(
      { method, url: fullUrl, status: res.status, durationMs },
      'api response malformed JSON'
    );
    const err = new Error('Server returned an invalid response');
    (err as Error & { status: number; url: string }).status = res.status;
    (err as Error & { status: number; url: string }).url = fullUrl;
    throw err;
  }

  if (!json.success) {
    log.error(
      { method, url: fullUrl, error: json.error, status: res.status, durationMs },
      'api request failed'
    );
    const err = new Error((json.error as string) || 'Request failed');
    (err as Error & { status: number; url: string }).status = res.status;
    (err as Error & { status: number; url: string }).url = fullUrl;
    throw err;
  }

  log.debug({ method, url: fullUrl, status: res.status, durationMs }, 'api request success');
  return json.data as T;
}

export const api = {
  expenses: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return request<unknown[]>(`/expenses${query}`);
    },
    get: (id: string) => request<unknown>(`/expenses/${id}`),
    create: (data: unknown) =>
      request<unknown>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    approve: (id: string) => request<unknown>(`/expenses/${id}/approve`, { method: 'POST' }),
    reject: (id: string) => request<unknown>(`/expenses/${id}/reject`, { method: 'POST' }),
  },
  employees: {
    list: () => request<unknown[]>('/employees'),
  },
  categories: {
    list: () => request<unknown[]>('/categories'),
  },
  cards: {
    list: () => request<unknown[]>('/cards'),
  },
  vendors: {
    list: () => request<unknown[]>('/vendors'),
  },
  budgets: {
    list: () => request<unknown[]>('/budgets'),
  },
};

// SWR fetcher — returns `any` to satisfy SWR generic type inference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = async (url: string): Promise<any> => {
  // Network error simulation: 20% chance of TypeError
  if (isFailureActive('networkErrorSimulation') && Math.random() < 0.2) {
    log.error({ url, injectedError: 'network_drop' }, 'chaos: simulated network failure (fetcher)');
    throw new TypeError('Failed to fetch');
  }

  const start = performance.now();
  const res = await fetch(url);
  const durationMs = Math.round(performance.now() - start);

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    log.error({ url, status: res.status, durationMs }, 'fetcher response malformed JSON');
    throw new Error('Server returned an invalid response');
  }

  if (!json.success) {
    log.error({ url, error: json.error, status: res.status, durationMs }, 'fetcher request failed');
    throw new Error((json.error as string) || 'Request failed');
  }

  log.debug({ url, status: res.status, durationMs }, 'fetcher request success');
  return json.data;
};
