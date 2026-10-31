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

// German decimal comma ("62,5"), matching the rest of the German UI and what users type -- input
// accepts both separators (parseWeightInput). Deliberately not Intl/toLocaleString: no thousands
// separator wanted, and Intl support differs between Hermes builds.
export function formatDecimal(value: number): string {
  return String(value).replace('.', ',');
}

// Works for both a single set's weight and an aggregate like total_volume -- the kg->lb
// conversion is a linear scalar, so it distributes over a sum just like it does over one value.
export function formatWeight(kg: number, unit: UnitPreference): string {
  const value = unit === 'lb' ? kgToLb(kg) : kg;
  return `${formatDecimal(value)} ${unit}`;
}

// Accepts a decimal comma as well as a dot: German (and most European) numeric keyboards only
// offer ",", which used to parse as NaN and silently clear the field.
export function parseWeightInput(text: string, unit: UnitPreference): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  // Negative weights are rejected by the sets/routine_exercise_sets CHECK constraints (0007) --
  // letting one through would only make the whole workout fail to save at the very end.
  if (Number.isNaN(value) || value < 0) return null;
  return unit === 'lb' ? lbToKg(value) : round(value, 2);
}

// Text to prefill an editable weight field with (inverse of parseWeightInput).
export function formatWeightInputValue(kg: number | null, unit: UnitPreference): string {
  if (kg === null) return '';
  return formatDecimal(unit === 'lb' ? kgToLb(kg) : kg);
}
