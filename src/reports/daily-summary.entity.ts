import { Column, Entity, PrimaryColumn } from 'typeorm';
import { moneyTransformer } from '../common/money.transformer';

@Entity('daily_summaries')
export class DailySummary {
  /** UTC calendar date (YYYY-MM-DD). */
  @PrimaryColumn({ type: 'date' })
  date!: string;

  @Column({
    type: 'numeric',
    precision: 19,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  totalCredits!: string;

  @Column({
    type: 'numeric',
    precision: 19,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  totalDebits!: string;

  @Column({ type: 'int', default: 0 })
  transactionCount!: number;

  @Column({ type: 'int', default: 0 })
  activeWallets!: number;
}
