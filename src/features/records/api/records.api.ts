import { supabase } from '@/shared/lib/supabase';

import type { ExerciseRecordSummary } from '../types/record.types';

// Flat queries joined in JS -- same pattern as elsewhere (getWorkoutDetail, getExerciseHistory,
// getMuscleSplit). One row per exercise, combining whichever of the two record types
// (max_weight, estimated_1rm) exist for it -- an exercise can have only one of the two if its
// sets were never logged with both weight and reps (see 0003_add_estimated_1rm_personal_record.sql).
export async function getPersonalRecords(userId: string): Promise<ExerciseRecordSummary[]> {
  const { data: records, error: recordsError } = await supabase
    .from('personal_records')
    .select('exercise_id, record_type, value, achieved_at')
    .eq('user_id', userId)
    .in('record_type', ['max_weight', 'estimated_1rm']);
  if (recordsError) throw recordsError;
  if (records.length === 0) return [];

  const exerciseIds = Array.from(new Set(records.map((record) => record.exercise_id)));
  const { data: exercises, error: namesError } = await supabase
    .from('exercises')
    .select('id, name')
    .in('id', exerciseIds);
  if (namesError) throw namesError;

  const nameById = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));

  const byExercise = new Map<string, Omit<ExerciseRecordSummary, 'exerciseId' | 'exerciseName'>>();
  for (const record of records) {
    const entry = byExercise.get(record.exercise_id) ?? {
      maxWeight: null,
      estimated1Rm: null,
      achievedAt: record.achieved_at,
    };
    if (record.record_type === 'max_weight') entry.maxWeight = record.value;
    if (record.record_type === 'estimated_1rm') entry.estimated1Rm = record.value;
    if (record.achieved_at > entry.achievedAt) entry.achievedAt = record.achieved_at;
    byExercise.set(record.exercise_id, entry);
  }

  return Array.from(byExercise.entries())
    .map(([exerciseId, entry]) => ({
      exerciseId,
      exerciseName: nameById.get(exerciseId) ?? '',
      ...entry,
    }))
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}
