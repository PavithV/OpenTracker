import { describe, expect, it } from 'vitest';

import { parseWholeNumberInput } from './number-input';

describe('parseWholeNumberInput', () => {
  it('parses whole numbers', () => {
    expect(parseWholeNumberInput('8')).toBe(8);
    expect(parseWholeNumberInput(' 12 ')).toBe(12);
    expect(parseWholeNumberInput('0')).toBe(0);
  });

  it('treats empty, negative, fractional and non-numeric input as empty', () => {
    for (const text of ['', '-3', '8.5', '8,5', 'abc', '1e3']) {
      expect(parseWholeNumberInput(text)).toBeNull();
    }
  });
});
