/**
 * Hand-written until a live Supabase project exists. Once `supabase/migrations/0001_init.sql`
 * has been applied to a real project, regenerate this file with:
 *   npx supabase gen types typescript --project-id <id> > src/shared/types/database.types.ts
 * Shape must stay in sync with DATABASE.md.
 */

export type UnitPreference = 'kg' | 'lb';
export type SetType = 'warmup' | 'working' | 'dropset' | 'failure';
export type PersonalRecordType = 'max_weight' | 'max_volume' | 'max_reps' | 'estimated_1rm';
export type InstructionLanguage = 'en' | 'es' | 'it' | 'tr' | 'ru' | 'zh' | 'hi' | 'pl' | 'ko' | 'fr';
export type Instructions = Record<InstructionLanguage, string>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          unit_preference: UnitPreference;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          external_id: string | null;
          name: string;
          category: string;
          equipment: string;
          target_muscle: string;
          secondary_muscles: string[];
          instructions: Instructions;
          image_url: string | null;
          gif_url: string | null;
          attribution: string | null;
          is_custom: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['exercises']['Row']> & {
          name: string;
          category: string;
          equipment: string;
          target_muscle: string;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Row']>;
        Relationships: [];
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['routines']['Row']> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['routines']['Row']>;
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number;
          target_reps_min: number;
          target_reps_max: number | null;
          target_weight: number | null;
          rest_seconds: number | null;
        };
        Insert: Partial<Database['public']['Tables']['routine_exercises']['Row']> & {
          routine_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database['public']['Tables']['routine_exercises']['Row']>;
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          name: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          total_volume: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['workouts']['Row']> & {
          user_id: string;
          name: string;
          started_at: string;
        };
        Update: Partial<Database['public']['Tables']['workouts']['Row']>;
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          order_index: number;
          notes: string | null;
        };
        Insert: Partial<Database['public']['Tables']['workout_exercises']['Row']> & {
          workout_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database['public']['Tables']['workout_exercises']['Row']>;
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          set_type: SetType;
          weight: number | null;
          reps: number | null;
          duration_seconds: number | null;
          rpe: number | null;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['sets']['Row']> & {
          workout_exercise_id: string;
          set_number: number;
        };
        Update: Partial<Database['public']['Tables']['sets']['Row']>;
        Relationships: [];
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          record_type: PersonalRecordType;
          value: number;
          set_id: string | null;
          achieved_at: string;
        };
        Insert: Partial<Database['public']['Tables']['personal_records']['Row']> & {
          user_id: string;
          exercise_id: string;
          record_type: PersonalRecordType;
          value: number;
          achieved_at: string;
        };
        Update: Partial<Database['public']['Tables']['personal_records']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      finish_workout: {
        Args: { p_workout_id: string };
        Returns: Database['public']['Tables']['workouts']['Row'];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
