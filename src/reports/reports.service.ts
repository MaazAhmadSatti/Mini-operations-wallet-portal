import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatMoney } from '../common/money';
import { DailySummary } from './daily-summary.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailySummary)
    private readonly dailySummariesRepository: Repository<DailySummary>,
  ) {}

  async getDailySummary(date: string): Promise<DailySummary> {
    const normalized = date.slice(0, 10);
    const summary = await this.dailySummariesRepository.findOne({
      where: { date: normalized },
    });

    if (summary) {
      return summary;
    }

    // Empty day: return zeros without requiring a persisted row
    return {
      date: normalized,
      totalCredits: formatMoney('0'),
      totalDebits: formatMoney('0'),
      transactionCount: 0,
      activeWallets: 0,
    };
  }
}
