import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserStatus, WalletStatus } from '../common/enums';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Transaction } from '../transactions/transaction.entity';
import { DailySummary } from '../reports/daily-summary.entity';
import { Wallet } from './wallet.entity';
import { WalletsService } from './wallets.service';

describe('WalletsService money movements', () => {
  let service: WalletsService;
  let walletState: Wallet;
  let userState: User;
  let existingByRef: Map<string, Transaction>;

  const createManager = () => {
    const manager = {
      findOne: jest.fn(
        (entity: unknown, opts: { where: Record<string, string> }) => {
          if (entity === Wallet) {
            return { ...walletState, user: undefined };
          }
          if (entity === User) {
            return { ...userState };
          }
          if (entity === Transaction) {
            const key = `${opts.where.walletId}:${opts.where.referenceId}`;
            return existingByRef.get(key) ?? null;
          }
          if (entity === DailySummary) {
            return null;
          }
          return null;
        },
      ),
      create: jest.fn((_entity: unknown, data: object) => ({
        ...data,
        createdAt: new Date('2026-07-15T12:00:00.000Z'),
      })),
      save: jest.fn((entity: Wallet | Transaction | DailySummary) => {
        if ('balance' in entity && 'currency' in entity) {
          walletState.balance = entity.balance;
          return entity;
        }
        if ('referenceId' in entity && 'walletId' in entity) {
          const tx: Transaction = {
            ...entity,
            id: `tx-${existingByRef.size + 1}`,
            createdAt:
              entity.createdAt instanceof Date
                ? entity.createdAt
                : new Date('2026-07-15T12:00:00.000Z'),
          };
          existingByRef.set(`${tx.walletId}:${tx.referenceId}`, tx);
          return tx;
        }
        return entity;
      }),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
      })),
    };
    return manager;
  };

  beforeEach(async () => {
    existingByRef = new Map();
    userState = {
      id: 'user-1',
      name: 'Test',
      phone: '10000000001',
      email: 't@example.com',
      status: UserStatus.ACTIVE,
      wallets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    walletState = {
      id: 'wallet-1',
      userId: 'user-1',
      currency: 'USD',
      balance: '100.00',
      status: WalletStatus.ACTIVE,
      user: userState,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dataSource = {
      transaction: jest.fn(
        async (cb: (m: ReturnType<typeof createManager>) => Promise<unknown>) =>
          cb(createManager()),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: getRepositoryToken(Wallet), useValue: {} },
        { provide: UsersService, useValue: { findByIdOrFail: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(WalletsService);
  });

  it('credits a wallet and records balanceBefore/balanceAfter', async () => {
    const txn = await service.credit('wallet-1', {
      amount: '25.50',
      referenceId: 'ref-credit-1',
      description: 'top-up',
    });

    expect(txn.type).toBe('credit');
    expect(txn.amount).toBe('25.50');
    expect(txn.balanceBefore).toBe('100.00');
    expect(txn.balanceAfter).toBe('125.50');
    expect(walletState.balance).toBe('125.50');
  });

  it('debits a wallet when funds are sufficient', async () => {
    const txn = await service.debit('wallet-1', {
      amount: '40.00',
      referenceId: 'ref-debit-1',
    });

    expect(txn.type).toBe('debit');
    expect(txn.balanceBefore).toBe('100.00');
    expect(txn.balanceAfter).toBe('60.00');
    expect(walletState.balance).toBe('60.00');
  });

  it('rejects duplicate referenceId with a meaningful 409 message', async () => {
    await service.credit('wallet-1', {
      amount: '10.00',
      referenceId: 'dup-ref',
    });

    await expect(
      service.credit('wallet-1', {
        amount: '10.00',
        referenceId: 'dup-ref',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      service.credit('wallet-1', {
        amount: '10.00',
        referenceId: 'dup-ref',
      }),
    ).rejects.toThrow(/already been processed/);
  });

  it('rejects debit that would make balance negative', async () => {
    await expect(
      service.debit('wallet-1', {
        amount: '150.00',
        referenceId: 'overdraft',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.debit('wallet-1', {
        amount: '150.00',
        referenceId: 'overdraft-2',
      }),
    ).rejects.toThrow(/Insufficient funds/);
  });

  it('blocks credit/debit when wallet is frozen', async () => {
    walletState.status = WalletStatus.FROZEN;

    await expect(
      service.debit('wallet-1', { amount: '1.00', referenceId: 'frozen-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.debit('wallet-1', { amount: '1.00', referenceId: 'frozen-2' }),
    ).rejects.toThrow(/frozen/);
  });

  it('blocks credit/debit when user is inactive', async () => {
    userState.status = UserStatus.INACTIVE;

    await expect(
      service.credit('wallet-1', { amount: '1.00', referenceId: 'inactive-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.credit('wallet-1', { amount: '1.00', referenceId: 'inactive-2' }),
    ).rejects.toThrow(/inactive/);
  });

  /**
   * Concurrency scenario (unit-level): overlapping debit callbacks are forced
   * through one shared wallet balance under a serialized "lock" (simulates
   * Postgres FOR UPDATE). Two concurrent 60 debits from 100 must not both
   * succeed — final balance must never go negative / corrupt.
   */
  it('does not corrupt balance under concurrent debits (serialized lock simulation)', async () => {
    let balance = '100.00';
    let lock: Promise<void> = Promise.resolve();

    const withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
      const prev = lock;
      let release!: () => void;
      lock = new Promise<void>((resolve) => {
        release = resolve;
      });
      await prev;
      try {
        return await fn();
      } finally {
        release();
      }
    };

    const dataSource = {
      transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) =>
        withLock(async () => {
          const manager = {
            findOne: jest.fn(
              (entity: unknown, opts: { where: Record<string, string> }) => {
                if (entity === Wallet) {
                  return {
                    id: 'wallet-1',
                    userId: 'user-1',
                    currency: 'USD',
                    balance,
                    status: WalletStatus.ACTIVE,
                  };
                }
                if (entity === User) {
                  return { ...userState, status: UserStatus.ACTIVE };
                }
                if (entity === Transaction) {
                  const key = `${opts.where.walletId}:${opts.where.referenceId}`;
                  return existingByRef.get(key) ?? null;
                }
                if (entity === DailySummary) {
                  return null;
                }
                return null;
              },
            ),
            create: jest.fn((_e: unknown, data: object) => ({
              ...data,
              createdAt: new Date('2026-07-15T12:00:00.000Z'),
            })),
            save: jest.fn((entity: Wallet | Transaction | DailySummary) => {
              if ('balance' in entity && 'currency' in entity) {
                balance = entity.balance;
                return entity;
              }
              if ('referenceId' in entity && 'walletId' in entity) {
                const tx: Transaction = {
                  ...entity,
                  id: `tx-${existingByRef.size + 1}`,
                  createdAt: new Date('2026-07-15T12:00:00.000Z'),
                };
                existingByRef.set(`${tx.walletId}:${tx.referenceId}`, tx);
                return tx;
              }
              return entity;
            }),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
            })),
          };
          return cb(manager);
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: getRepositoryToken(Wallet), useValue: {} },
        { provide: UsersService, useValue: { findByIdOrFail: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    const concurrentService = module.get(WalletsService);

    const results = await Promise.allSettled([
      concurrentService.debit('wallet-1', {
        amount: '60.00',
        referenceId: 'concurrent-a',
      }),
      concurrentService.debit('wallet-1', {
        amount: '60.00',
        referenceId: 'concurrent-b',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].status).toBe('rejected');
    if (rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(BadRequestException);
    }
    expect(balance).toBe('40.00');
  });
});
