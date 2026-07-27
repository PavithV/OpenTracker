export type UnitPreference = 'kg' | 'lb';

const LB_PER_KG = 2.2046226218;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Display only -- rounds to 1 decimal, never fed back into storage.
export function kgToLb(kg: number): number {
  return round(kg * LB_PER_KG, 1);
}

// Converts user-entered lb back to canonical kg before it touches a draft store or Supabase.
// Rounds to 2 decimals, matching the numeric precision used everywhere else (e.g. plate-calculator's round2).
export function lbToKg(lb: number): number {
  return round(lb / LB_PER_KG, 2);
}

// Works for both a single set's weight and an aggregate like total_volume -- the kg->lb
// conversion is a linear scalar, so it distributes over a sum just like it does over one value.
export function formatWeight(kg: number, unit: UnitPreference): string {
  const value = unit === 'lb' ? kgToLb(kg) : kg;
  return `${value} ${unit}`;
}

export function parseWeightInput(text: string, unit: UnitPreference): number | null {
  if (text === '') return null;
  const value = Number(text);
  if (Number.isNaN(value)) return null;
  return unit === 'lb' ? lbToKg(value) : round(value, 2);
}
