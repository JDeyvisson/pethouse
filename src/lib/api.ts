const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public fields?: Record<string, string>,
    public status?: number,
  ) {
    super(message)
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }
  let body: { error?: { code?: string; message?: string; fields?: Record<string, string> } } = {}
  try { body = await res.json() } catch { /* ignore */ }
  const e = body.error ?? {}
  throw new ApiError(e.code ?? 'HTTP_ERROR', e.message ?? res.statusText, e.fields, res.status)
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('ph_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      headers: { ...authHeaders() },
    }).then(r => handleResponse<T>(r))
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }).then(r => handleResponse<T>(r))
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }).then(r => handleResponse<T>(r))
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }).then(r => handleResponse<T>(r))
  },

  delete<T>(path: string): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    }).then(r => handleResponse<T>(r))
  },

  upload<T>(path: string, formData: FormData, method: 'POST' | 'PUT' | 'PATCH' = 'POST'): Promise<T> {
    return fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...authHeaders() },
      body: formData,
    }).then(r => handleResponse<T>(r))
  },
}
