import { describe, it, expect } from 'vitest';
import {
  normalizeIndianCurrency,
  normalizePercentage,
  normalizeRoomOrIcuLimit
} from '../src/services/normalizerService.js';

describe('Normalizers', () => {
  it('normalizes "3,00,000" to 300000', () => {
    expect(normalizeIndianCurrency('3,00,000')).toBe(300000);
  });

  it('normalizes "₹3 lakh" to 300000', () => {
    expect(normalizeIndianCurrency('₹3 lakh')).toBe(300000);
    expect(normalizeIndianCurrency('3 Lakhs')).toBe(300000);
    expect(normalizeIndianCurrency('Rs. 5 Lakh')).toBe(500000);
  });

  it('normalizes "10%" to 10', () => {
    expect(normalizePercentage('10%')).toBe(10);
    expect(normalizePercentage(' 20 % ')).toBe(20);
    expect(normalizePercentage(15)).toBe(15);
  });

  it('normalizes "Rs.3,000 per day" to { type: "amount", value: 3000 }', () => {
    const result = normalizeRoomOrIcuLimit('Rs.3,000 per day');
    expect(result).toEqual({ type: 'amount', value: 3000 });
  });

  it('normalizes "1% of sum insured" to { type: "percent", value: 1 }', () => {
    const result = normalizeRoomOrIcuLimit('1% of sum insured');
    expect(result).toEqual({ type: 'percent', value: 1 });
  });

  it('normalizes category room limits and none', () => {
    expect(normalizeRoomOrIcuLimit('Single Standard A/C Room')).toEqual({
      type: 'category',
      value: 'Single Standard A/C Room'
    });
    expect(normalizeRoomOrIcuLimit('no limit mentioned')).toEqual({
      type: 'none',
      value: null
    });
  });
});
