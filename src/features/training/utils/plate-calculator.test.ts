import { describe, expect, it } from 'vitest';

import { calculatePlateLoadout } from './plate-calculator';

describe('calculatePlateLoadout', () => {
  it('resolves an exactly reachable target', () => {
    expect(calculatePlateLoadout(140, 20)).toEqual({
      perSide: [
        { weightKg: 25, count: 2 },
        { weightKg: 10, count: 1 },
      ],
      totalWeightKg: 140,
    });
  });

  it('returns no plates when the target is below the bar weight', () => {
    expect(calculatePlateLoadout(10, 20)).toEqual({
      perSide: [],
      totalWeightKg: 20,
    });
  });

  it('returns no plates when the target equals the bar weight', () => {
    expect(calculatePlateLoadout(20, 20)).toEqual({
      perSide: [],
      totalWeightKg: 20,
    });
  });

  it('rounds down to the nearest achievable weight when the target is not exactly reachable', () => {
    // Documented in TODO.md item 4: 43kg on a 20kg bar -> nearest achievable is 42.5kg.
    expect(calculatePlateLoadout(43, 20)).toEqual({
      perSide: [
        { weightKg: 10, count: 1 },
        { weightKg: 1.25, count: 1 },
      ],
      totalWeightKg: 42.5,
    });
  });

  it('handles the no-bar case', () => {
    expect(calculatePlateLoadout(50, 0)).toEqual({
      perSide: [{ weightKg: 25, count: 1 }],
      totalWeightKg: 50,
    });
  });
});
