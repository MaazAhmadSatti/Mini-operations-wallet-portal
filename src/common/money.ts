import { Decimal } from 'decimal.js';
import { BadRequestException } from '@nestjs/common';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: string | Decimal): Decimal {
  try {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    if (!decimal.isFinite()) {
      throw new Error('not finite');
    }
    return decimal;
  } catch {
    throw new BadRequestException('Invalid monetary amount');
  }
}

export function assertPositiveAmount(value: string): Decimal {
  const amount = toDecimal(value);
  if (amount.lte(0)) {
    throw new BadRequestException('Amount must be greater than zero');
  }
  return amount;
}

export function formatMoney(value: Decimal | string): string {
  return toDecimal(value).toFixed(2);
}
