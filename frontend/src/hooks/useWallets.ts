import { useCallback, useEffect, useState } from 'react';
import { createWallet, listWallets } from '../api/wallets';
import type { PaginatedResult, Wallet, WalletStatus } from '../types';
import { ApiError } from '../types';

export function useWallets(page: number, userId?: string) {
  const [result, setResult] = useState<PaginatedResult<Wallet> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await listWallets({
          page,
          limit: 20,
          userId: userId || undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load wallets');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (input: {
    userId: string;
    currency: string;
    status?: WalletStatus;
  }) => {
    const wallet = await createWallet(input);
    await reload();
    return wallet;
  };

  return { result, loading, error, reload, create };
}
