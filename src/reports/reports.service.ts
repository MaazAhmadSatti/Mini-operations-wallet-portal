import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatMoney, toDecimal } from '../common/money';
import { TransactionType } from '../common/enums';
import { Transaction } from '../transactions/transaction.entity';
import { Wallet } from '../wallets/wallet.entity';
import { DailySummary } from './daily-summary.entity';
import { OverviewReportDto } from './dto/overview-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailySummary)
    private readonly dailySummariesRepository: Repository<DailySummary>,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async getDailySummary(date: string): Promise<DailySummary> {
    const normalized = date.slice(0, 10);
    const summary = await this.dailySummariesRepository.findOne({
      where: { date: normalized },
    });

    if (summary) {
      return summary;
    }

    return {
      date: normalized,
      totalCredits: formatMoney('0'),
      totalDebits: formatMoney('0'),
      transactionCount: 0,
      activeWallets: 0,
    };
  }

  async getOverview(): Promise<OverviewReportDto> {
    const totalWallets = await this.walletsRepository.count();

    const balanceRaw = await this.walletsRepository
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.balance), 0)', 'sum')
      .getRawOne<{ sum: string }>();

    const creditsRaw = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'sum')
      .where('t.type = :type', { type: TransactionType.CREDIT })
      .getRawOne<{ sum: string }>();

    const debitsRaw = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'sum')
      .where('t.type = :type', { type: TransactionType.DEBIT })
      .getRawOne<{ sum: string }>();

    const transactionCount = await this.transactionsRepository.count();

    return {
      totalWallets,
      totalBalance: formatMoney(toDecimal(balanceRaw?.sum ?? '0')),
      totalCredits: formatMoney(toDecimal(creditsRaw?.sum ?? '0')),
      totalDebits: formatMoney(toDecimal(debitsRaw?.sum ?? '0')),
      transactionCount,
    };
  }
}
