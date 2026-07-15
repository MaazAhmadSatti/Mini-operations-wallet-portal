import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus, WalletStatus } from '../common/enums';
import { formatMoney } from '../common/money';
import { User } from '../users/user.entity';
import { Wallet } from '../wallets/wallet.entity';

const SEED_USERS = [
  {
    email: 'seed.alice@example.com',
    name: 'Alice Seed',
    phone: '+10000000001',
  },
  {
    email: 'seed.bob@example.com',
    name: 'Bob Seed',
    phone: '+10000000002',
  },
  {
    email: 'seed.carol@example.com',
    name: 'Carol Seed',
    phone: '+10000000003',
  },
] as const;

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled =
      this.configService.get<string>('SEED_DATA', 'false').toLowerCase() ===
      'true';

    if (!enabled) {
      this.logger.log('SEED_DATA is not true — skipping seed');
      return;
    }

    await this.seed();
  }

  private async seed(): Promise<void> {
    for (const seedUser of SEED_USERS) {
      let user = await this.usersRepository.findOne({
        where: { email: seedUser.email },
      });

      if (!user) {
        user = await this.usersRepository.save(
          this.usersRepository.create({
            name: seedUser.name,
            phone: seedUser.phone,
            email: seedUser.email,
            status: UserStatus.ACTIVE,
          }),
        );
        this.logger.log(`Seeded user ${user.email}`);
      }

      const existingWallet = await this.walletsRepository.findOne({
        where: { userId: user.id, currency: 'USD' },
      });

      if (!existingWallet) {
        const wallet = await this.walletsRepository.save(
          this.walletsRepository.create({
            userId: user.id,
            currency: 'USD',
            balance: formatMoney('100'),
            status: WalletStatus.ACTIVE,
          }),
        );
        this.logger.log(
          `Seeded USD wallet ${wallet.id} for ${user.email} with balance 100`,
        );
      }
    }

    this.logger.log('Seed complete (3 users / USD wallets @ 100 when missing)');
  }
}
