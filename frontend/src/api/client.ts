import { ApiError } from '../types';

const API_BASE = '/api';

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message || res.statusText || 'Request failed';
    return new ApiError(res.status, message);
  } catch {
    return new ApiError(res.status, res.statusText || 'Request failed');
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json() as Promise<T>;
}
