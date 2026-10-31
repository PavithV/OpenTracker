// Parses reps/rest-seconds style fields. These end up in integer columns with non-negative CHECK
// constraints (sets.reps, routine_exercise_sets.target_reps, ...): "8.5" or "-3" used to be
// passed straight through and only blew up when the whole workout/routine was saved, and
// non-numeric text was stored as NaN. Anything that is not a whole number >= 0 now reads as empty.
export function parseWholeNumberInput(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}
