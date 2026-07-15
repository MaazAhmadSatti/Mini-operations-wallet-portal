export type UserStatus = 'active' | 'inactive';
export type WalletStatus = 'active' | 'frozen';
export type TransactionType = 'credit' | 'debit';

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceId: string;
  description: string | null;
  createdAt: string;
}

export interface OverviewReport {
  totalWallets: number;
  totalBalance: string;
  totalCredits: string;
  totalDebits: string;
  transactionCount: number;
}

export interface DailySummary {
  date: string;
  totalCredits: string;
  totalDebits: string;
  transactionCount: number;
  activeWallets: number;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
