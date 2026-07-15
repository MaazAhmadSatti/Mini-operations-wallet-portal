import { useCallback, useEffect, useState } from 'react';
import {
  creditWallet,
  debitWallet,
  getWallet,
  listTransactions,
} from '../api/wallets';
import type { PaginatedResult, Transaction, Wallet } from '../types';
import { ApiError } from '../types';

export function useWallet(walletId: string) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<PaginatedResult<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, t] = await Promise.all([
        getWallet(walletId),
        listTransactions(walletId, { page: 1, limit: 50 }),
      ]);
      setWallet(w);
      setTxns(t);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load wallet');
      setWallet(null);
      setTxns(null);
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const credit = async (amount: string, description?: string) => {
    const referenceId = crypto.randomUUID();
    const txn = await creditWallet(walletId, {
      amount,
      referenceId,
      description,
    });
    await reload();
    return txn;
  };

  const debit = async (amount: string, description?: string) => {
    const referenceId = crypto.randomUUID();
    const txn = await debitWallet(walletId, {
      amount,
      referenceId,
      description,
    });
    await reload();
    return txn;
  };

  return { wallet, txns, loading, error, reload, credit, debit };
}
