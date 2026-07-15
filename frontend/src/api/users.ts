import { apiGet, apiPost } from './client';
import type { PaginatedResult, User, UserStatus } from '../types';

export function listUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<User>> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return apiGet(`/users${qs ? `?${qs}` : ''}`);
}

export function createUser(body: {
  name: string;
  phone: string;
  email: string;
  status?: UserStatus;
}): Promise<User> {
  return apiPost('/users', body);
}
