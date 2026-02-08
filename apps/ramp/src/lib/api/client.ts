const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
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
};

// SWR fetcher
export const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (!json.success) throw new Error(json.error);
      return json.data;
    });
