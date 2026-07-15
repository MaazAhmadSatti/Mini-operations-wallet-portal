import { apiGet, apiPost } from './client';
import type {
  PaginatedResult,
  Transaction,
  TransactionType,
  Wallet,
  WalletStatus,
} from '../types';

export function listWallets(params: {
  page?: number;
  limit?: number;
  userId?: string;
  currency?: string;
  status?: WalletStatus;
}): Promise<PaginatedResult<Wallet>> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.userId) q.set('userId', params.userId);
  if (params.currency) q.set('currency', params.currency);
  if (params.status) q.set('status', params.status);
  const qs = q.toString();
  return apiGet(`/wallets${qs ? `?${qs}` : ''}`);
}

export function getWallet(id: string): Promise<Wallet> {
  return apiGet(`/wallets/${id}`);
}

export function createWallet(body: {
  userId: string;
  currency: string;
  status?: WalletStatus;
}): Promise<Wallet> {
  return apiPost('/wallets', body);
}

export function listTransactions(
  walletId: string,
  params: {
    page?: number;
    limit?: number;
    type?: TransactionType;
    referenceId?: string;
  },
): Promise<PaginatedResult<Transaction>> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.type) q.set('type', params.type);
  if (params.referenceId) q.set('referenceId', params.referenceId);
  const qs = q.toString();
  return apiGet(`/wallets/${walletId}/transactions${qs ? `?${qs}` : ''}`);
}

export function creditWallet(
  walletId: string,
  body: { amount: string; referenceId: string; description?: string },
): Promise<Transaction> {
  return apiPost(`/wallets/${walletId}/credit`, body);
}

export function debitWallet(
  walletId: string,
  body: { amount: string; referenceId: string; description?: string },
): Promise<Transaction> {
  return apiPost(`/wallets/${walletId}/debit`, body);
}
