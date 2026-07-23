import { supabase } from '@/shared/lib/supabase';

import type { ExerciseFilters, ExerciseListItem } from '../types/exercise.types';

const PAGE_SIZE = 50;

export async function getExercises(filters: ExerciseFilters): Promise<ExerciseListItem[]> {
  let query = supabase
    .from('exercises')
    .select('id, name, category, equipment, target_muscle, image_url')
    .order('name')
    .limit(PAGE_SIZE);

  if (filters.search) query = query.ilike('name', `%${filters.search}%`);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.equipment) query = query.eq('equipment', filters.equipment);

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    equipment: row.equipment,
    targetMuscle: row.target_muscle,
    imageUrl: row.image_url,
  }));
}
