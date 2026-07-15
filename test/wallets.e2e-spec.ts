import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * Integration / e2e against a real Postgres (uses .env DB_* settings).
 * Requires: docker compose up postgres -d (or local Postgres matching .env)
 */
describe('Wallets money flows (e2e)', () => {
  let app: INestApplication<App>;
  let userId: string;
  let walletId: string;

  beforeAll(async () => {
    process.env.SEED_DATA = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const email = `e2e-${Date.now()}@example.com`;
    const userRes = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        name: 'E TWO E User',
        phone: '19998887777',
        email,
      })
      .expect(201);

    userId = userRes.body.id as string;

    const walletRes = await request(app.getHttpServer())
      .post('/api/wallets')
      .send({ userId, currency: 'USD' })
      .expect(201);

    walletId = walletRes.body.id as string;
    expect(walletRes.body.balance).toBe('0.00');
  });

  afterAll(async () => {
    await app.close();
  });

  it('credits a wallet over HTTP', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/wallets/${walletId}/credit`)
      .send({
        amount: '100.00',
        referenceId: `e2e-credit-${Date.now()}`,
        description: 'e2e credit',
      })
      .expect(201);

    expect(res.body.type).toBe('credit');
    expect(res.body.balanceBefore).toBe('0.00');
    expect(res.body.balanceAfter).toBe('100.00');

    const wallet = await request(app.getHttpServer())
      .get(`/api/wallets/${walletId}`)
      .expect(200);

    expect(wallet.body.balance).toBe('100.00');
  });

  it('debits a wallet over HTTP', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/wallets/${walletId}/debit`)
      .send({
        amount: '30.00',
        referenceId: `e2e-debit-${Date.now()}`,
      })
      .expect(201);

    expect(res.body.type).toBe('debit');
    expect(res.body.balanceBefore).toBe('100.00');
    expect(res.body.balanceAfter).toBe('70.00');
  });

  it('rejects duplicate referenceId with 409 and a clear message', async () => {
    const referenceId = `e2e-dup-${Date.now()}`;

    await request(app.getHttpServer())
      .post(`/api/wallets/${walletId}/credit`)
      .send({ amount: '5.00', referenceId })
      .expect(201);

    const dup = await request(app.getHttpServer())
      .post(`/api/wallets/${walletId}/credit`)
      .send({ amount: '5.00', referenceId })
      .expect(409);

    expect(String(dup.body.message)).toMatch(/already been processed/i);
  });

  it('rejects overdraft with a meaningful error', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/wallets/${walletId}/debit`)
      .send({
        amount: '99999.00',
        referenceId: `e2e-overdraft-${Date.now()}`,
      })
      .expect(400);

    expect(String(res.body.message)).toMatch(/Insufficient funds/i);
  });

  it('serializes concurrent debits against real Postgres lock', async () => {
    const walletRes = await request(app.getHttpServer())
      .post('/api/wallets')
      .send({ userId, currency: 'USD' })
      .expect(201);

    const concurrentWalletId = walletRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/wallets/${concurrentWalletId}/credit`)
      .send({
        amount: '100.00',
        referenceId: `e2e-concurrent-fund-${Date.now()}`,
      })
      .expect(201);

    const [a, b] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/wallets/${concurrentWalletId}/debit`)
        .send({
          amount: '60.00',
          referenceId: `e2e-concurrent-a-${Date.now()}`,
        }),
      request(app.getHttpServer())
        .post(`/api/wallets/${concurrentWalletId}/debit`)
        .send({
          amount: '60.00',
          referenceId: `e2e-concurrent-b-${Date.now() + 1}`,
        }),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 400]);

    const walletAfter = await request(app.getHttpServer())
      .get(`/api/wallets/${concurrentWalletId}`)
      .expect(200);

    expect(walletAfter.body.balance).toBe('40.00');
  });
});
