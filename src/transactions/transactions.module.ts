import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsModule } from '../wallets/wallets.module';
import { Transaction } from './transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), WalletsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
