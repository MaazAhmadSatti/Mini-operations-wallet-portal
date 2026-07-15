import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TransactionType } from '../common/enums';
import { moneyTransformer } from '../common/money.transformer';
import { Wallet } from '../wallets/wallet.entity';

@Entity('transactions')
@Unique('UQ_transactions_wallet_reference', ['walletId', 'referenceId'])
@Index('IDX_transactions_wallet_created', ['walletId', 'createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({
    type: 'numeric',
    precision: 19,
    scale: 2,
    transformer: moneyTransformer,
  })
  amount!: string;

  @Column({
    type: 'numeric',
    precision: 19,
    scale: 2,
    transformer: moneyTransformer,
  })
  balanceBefore!: string;

  @Column({
    type: 'numeric',
    precision: 19,
    scale: 2,
    transformer: moneyTransformer,
  })
  balanceAfter!: string;

  @Column({ type: 'varchar', length: 255 })
  referenceId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
