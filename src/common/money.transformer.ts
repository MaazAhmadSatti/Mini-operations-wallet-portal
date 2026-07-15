import { ValueTransformer } from 'typeorm';
import { formatMoney, toDecimal } from './money';

/** Persist numeric columns as fixed-scale decimal strings in the app layer. */
export const moneyTransformer: ValueTransformer = {
  to(value?: string | null): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return formatMoney(value);
  },
  from(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return formatMoney(toDecimal(value));
  },
};
