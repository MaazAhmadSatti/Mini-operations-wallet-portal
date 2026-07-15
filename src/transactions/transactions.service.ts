import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../common/pagination.dto';
import { WalletsService } from '../wallets/wallets.service';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly walletsService: WalletsService,
  ) {}

  async findByWallet(
    walletId: string,
    query: ListTransactionsQueryDto,
  ): Promise<PaginatedResult<Transaction>> {
    await this.walletsService.findById(walletId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.walletId = :walletId', { walletId })
      .orderBy('t.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.type) {
      qb.andWhere('t.type = :type', { type: query.type });
    }
    if (query.referenceId) {
      qb.andWhere('t.referenceId = :referenceId', {
        referenceId: query.referenceId,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }
}
