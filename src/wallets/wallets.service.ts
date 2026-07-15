import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionType, UserStatus, WalletStatus } from '../common/enums';
import { assertPositiveAmount, formatMoney, toDecimal } from '../common/money';
import { DailySummary } from '../reports/daily-summary.entity';
import { Transaction } from '../transactions/transaction.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ListWalletsQueryDto } from './dto/list-wallets-query.dto';
import { WalletMoneyDto } from './dto/wallet-money.dto';
import { Wallet } from './wallet.entity';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../common/pagination.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateWalletDto): Promise<Wallet> {
    await this.usersService.findByIdOrFail(dto.userId);

    const wallet = this.walletsRepository.create({
      userId: dto.userId,
      currency: dto.currency.toUpperCase(),
      balance: formatMoney('0'),
      status: dto.status ?? WalletStatus.ACTIVE,
    });

    return this.walletsRepository.save(wallet);
  }

  async findAll(query: ListWalletsQueryDto): Promise<PaginatedResult<Wallet>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.walletsRepository
      .createQueryBuilder('wallet')
      .orderBy('wallet.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.userId) {
      qb.andWhere('wallet.userId = :userId', { userId: query.userId });
    }
    if (query.currency) {
      qb.andWhere('UPPER(wallet.currency) = :currency', {
        currency: query.currency.toUpperCase(),
      });
    }
    if (query.status) {
      qb.andWhere('wallet.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }

  async findById(id: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet ${id} not found`);
    }
    return wallet;
  }

  async credit(walletId: string, dto: WalletMoneyDto): Promise<Transaction> {
    return this.applyMoneyMovement(walletId, dto, TransactionType.CREDIT);
  }

  async debit(walletId: string, dto: WalletMoneyDto): Promise<Transaction> {
    return this.applyMoneyMovement(walletId, dto, TransactionType.DEBIT);
  }

  /**
   * Applies credit/debit inside a DB transaction with a pessimistic wallet lock
   * so concurrent debits cannot corrupt balance. referenceId is unique per wallet.
   */
  private async applyMoneyMovement(
    walletId: string,
    dto: WalletMoneyDto,
    type: TransactionType,
  ): Promise<Transaction> {
    const amount = assertPositiveAmount(dto.amount);

    return this.dataSource.transaction(async (manager) => {
      // Lock wallet only — FOR UPDATE cannot be used with LEFT JOIN (user relation)
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet ${walletId} not found`);
      }

      const user = await manager.findOne(User, {
        where: { id: wallet.userId },
      });
      if (!user) {
        throw new NotFoundException('Wallet owner not found');
      }
      wallet.user = user;

      const existing = await manager.findOne(Transaction, {
        where: { walletId, referenceId: dto.referenceId },
      });
      if (existing) {
        throw new ConflictException(
          `referenceId "${dto.referenceId}" has already been processed for this wallet`,
        );
      }

      this.assertWalletOperable(wallet);

      const balanceBefore = toDecimal(wallet.balance);
      const balanceAfter =
        type === TransactionType.CREDIT
          ? balanceBefore.plus(amount)
          : balanceBefore.minus(amount);

      if (type === TransactionType.DEBIT && balanceAfter.isNegative()) {
        throw new BadRequestException(
          `Insufficient funds: balance ${formatMoney(balanceBefore)} cannot cover debit ${formatMoney(amount)}`,
        );
      }

      wallet.balance = formatMoney(balanceAfter);
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        type,
        amount: formatMoney(amount),
        balanceBefore: formatMoney(balanceBefore),
        balanceAfter: formatMoney(balanceAfter),
        referenceId: dto.referenceId,
        description: dto.description?.trim() || null,
      });
      const saved = await manager.save(transaction);

      await this.upsertDailySummary(manager, saved);

      return saved;
    });
  }

  private assertWalletOperable(wallet: Wallet): void {
    if (wallet.status === WalletStatus.FROZEN) {
      throw new ForbiddenException(
        'Wallet is frozen and cannot be credited or debited',
      );
    }
    if (!wallet.user) {
      throw new NotFoundException('Wallet owner not found');
    }
    if (wallet.user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(
        'User is inactive; wallet operations are not allowed',
      );
    }
  }

  private async upsertDailySummary(
    manager: EntityManager,
    transaction: Transaction,
  ): Promise<void> {
    const date = transaction.createdAt.toISOString().slice(0, 10);

    let summary = await manager.findOne(DailySummary, {
      where: { date },
      lock: { mode: 'pessimistic_write' },
    });

    if (!summary) {
      summary = manager.create(DailySummary, {
        date,
        totalCredits: formatMoney('0'),
        totalDebits: formatMoney('0'),
        transactionCount: 0,
        activeWallets: 0,
      });
    }

    if (transaction.type === TransactionType.CREDIT) {
      summary.totalCredits = formatMoney(
        toDecimal(summary.totalCredits).plus(transaction.amount),
      );
    } else {
      summary.totalDebits = formatMoney(
        toDecimal(summary.totalDebits).plus(transaction.amount),
      );
    }

    summary.transactionCount += 1;

    const activeWalletsResult = await manager
      .createQueryBuilder(Transaction, 't')
      .select('COUNT(DISTINCT t.walletId)', 'count')
      // Use CAST — TypeORM treats Postgres :: casts as named parameters
      .where(
        `CAST((t."createdAt" AT TIME ZONE 'UTC') AS DATE) = :summaryDate`,
        { summaryDate: date },
      )
      .getRawOne<{ count: string }>();

    summary.activeWallets = parseInt(activeWalletsResult?.count ?? '0', 10);

    await manager.save(summary);
  }
}
