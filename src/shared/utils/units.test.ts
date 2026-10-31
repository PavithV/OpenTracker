import { describe, expect, it } from 'vitest';

import { formatWeight, formatWeightInputValue, kgToLb, lbToKg, parseWeightInput } from './units';

describe('kgToLb / lbToKg', () => {
  it('round-trips realistic gym-weight increments cleanly', () => {
    for (const kg of [20, 60, 62.5, 100, 137.5]) {
      expect(kgToLb(lbToKg(kgToLb(kg)))).toBeCloseTo(kgToLb(kg), 1);
    }
  });

  it('converts known reference values', () => {
    expect(kgToLb(100)).toBeCloseTo(220.5, 1);
    expect(lbToKg(220.5)).toBeCloseTo(100, 1);
  });
});

describe('formatWeight', () => {
  it('passes kg through unchanged', () => {
    expect(formatWeight(60, 'kg')).toBe('60 kg');
  });

  it('uses a German decimal comma', () => {
    expect(formatWeight(62.5, 'kg')).toBe('62,5 kg');
  });

  it('converts to lb for display', () => {
    expect(formatWeight(100, 'lb')).toBe('220,5 lb');
  });
});

describe('parseWeightInput', () => {
  it('returns null for empty or invalid text', () => {
    expect(parseWeightInput('', 'kg')).toBeNull();
    expect(parseWeightInput('abc', 'lb')).toBeNull();
  });

  it('passes kg input through (rounded to 2 decimals)', () => {
    expect(parseWeightInput('62.5', 'kg')).toBe(62.5);
  });

  it('converts lb input back to canonical kg', () => {
    expect(parseWeightInput('220.5', 'lb')).toBeCloseTo(100, 1);
  });

  it('accepts a decimal comma (German numeric keyboards)', () => {
    expect(parseWeightInput('62,5', 'kg')).toBe(62.5);
    expect(parseWeightInput(' 22,5 ', 'kg')).toBe(22.5);
  });

  it('rejects negative weights (the DB would reject the whole workout)', () => {
    expect(parseWeightInput('-5', 'kg')).toBeNull();
  });

  it('parses an unfinished decimal while typing', () => {
    expect(parseWeightInput('62.', 'kg')).toBe(62);
    expect(parseWeightInput('62,', 'kg')).toBe(62);
  });
});

describe('formatWeightInputValue', () => {
  it('is empty for no weight', () => {
    expect(formatWeightInputValue(null, 'kg')).toBe('');
  });

  it('round-trips through parseWeightInput in both units', () => {
    for (const kg of [20, 22.5, 62.5, 100, 137.5]) {
      expect(parseWeightInput(formatWeightInputValue(kg, 'kg'), 'kg')).toBe(kg);
      expect(parseWeightInput(formatWeightInputValue(kg, 'lb'), 'lb')).toBeCloseTo(kg, 1);
    }
  });
});
