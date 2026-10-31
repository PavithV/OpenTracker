import { describe, expect, it } from 'vitest';

import { isRecentRecord } from './recent-record';

const now = new Date('2026-10-31T12:00:00Z');

describe('isRecentRecord', () => {
  it('is true within the last 7 days', () => {
    expect(isRecentRecord('2026-10-31T11:00:00Z', now)).toBe(true);
    expect(isRecentRecord('2026-10-24T12:00:00Z', now)).toBe(true);
  });

  it('is false for older records', () => {
    expect(isRecentRecord('2026-10-24T11:59:59Z', now)).toBe(false);
  });

  it('is false for timestamps in the future (clock skew)', () => {
    expect(isRecentRecord('2026-11-01T12:00:00Z', now)).toBe(false);
  });
});
