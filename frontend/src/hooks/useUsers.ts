import { useCallback, useEffect, useState } from 'react';
import { createUser, listUsers } from '../api/users';
import type { PaginatedResult, User, UserStatus } from '../types';
import { ApiError } from '../types';

export function useUsers(search: string, page: number) {
  const [result, setResult] = useState<PaginatedResult<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await listUsers({
          page,
          limit: 20,
          search: search.trim() || undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load users');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (input: {
    name: string;
    phone: string;
    email: string;
    status?: UserStatus;
  }) => {
    const user = await createUser(input);
    await reload();
    return user;
  };

  return { result, loading, error, reload, create };
}
