/**
 * Generated from the live Supabase project (project_ref rlcrhsubxcsjbqpgrwvs) after
 * supabase/migrations/0001_init.sql was applied. Regenerate with:
 *   npx supabase gen types typescript --project-id rlcrhsubxcsjbqpgrwvs > src/shared/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      exercises: {
        Row: {
          attribution: string | null;
          category: string;
          created_at: string;
          created_by: string | null;
          equipment: string;
          external_id: string | null;
          gif_url: string | null;
          id: string;
          image_url: string | null;
          instructions: Json;
          is_custom: boolean;
          name: string;
          secondary_muscles: string[];
          target_muscle: string;
        };
        Insert: {
          attribution?: string | null;
          category: string;
          created_at?: string;
          created_by?: string | null;
          equipment: string;
          external_id?: string | null;
          gif_url?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: Json;
          is_custom?: boolean;
          name: string;
          secondary_muscles?: string[];
          target_muscle: string;
        };
        Update: {
          attribution?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          equipment?: string;
          external_id?: string | null;
          gif_url?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: Json;
          is_custom?: boolean;
          name?: string;
          secondary_muscles?: string[];
          target_muscle?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercises_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      personal_records: {
        Row: {
          achieved_at: string;
          exercise_id: string;
          id: string;
          record_type: string;
          set_id: string | null;
          user_id: string;
          value: number;
        };
        Insert: {
          achieved_at?: string;
          exercise_id: string;
          id?: string;
          record_type: string;
          set_id?: string | null;
          user_id: string;
          value: number;
        };
        Update: {
          achieved_at?: string;
          exercise_id?: string;
          id?: string;
          record_type?: string;
          set_id?: string | null;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_records_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          unit_preference: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          unit_preference?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          unit_preference?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          exercise_id: string;
          id: string;
          order_index: number;
          rest_seconds: number | null;
          routine_id: string;
          target_reps_max: number | null;
          target_reps_min: number;
          target_sets: number;
          target_weight: number | null;
        };
        Insert: {
          exercise_id: string;
          id?: string;
          order_index: number;
          rest_seconds?: number | null;
          routine_id: string;
          target_reps_max?: number | null;
          target_reps_min?: number;
          target_sets?: number;
          target_weight?: number | null;
        };
        Update: {
          exercise_id?: string;
          id?: string;
          order_index?: number;
          rest_seconds?: number | null;
          routine_id?: string;
          target_reps_max?: number | null;
          target_reps_min?: number;
          target_sets?: number;
          target_weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routine_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'routine_exercises_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
        ];
      };
      routines: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'routines_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sets: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          duration_seconds: number | null;
          id: string;
          reps: number | null;
          rpe: number | null;
          set_number: number;
          set_type: string;
          weight: number | null;
          workout_exercise_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          reps?: number | null;
          rpe?: number | null;
          set_number: number;
          set_type?: string;
          weight?: number | null;
          workout_exercise_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          reps?: number | null;
          rpe?: number | null;
          set_number?: number;
          set_type?: string;
          weight?: number | null;
          workout_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sets_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_exercises: {
        Row: {
          exercise_id: string;
          id: string;
          notes: string | null;
          order_index: number;
          workout_id: string;
        };
        Insert: {
          exercise_id: string;
          id?: string;
          notes?: string | null;
          order_index: number;
          workout_id: string;
        };
        Update: {
          exercise_id?: string;
          id?: string;
          notes?: string | null;
          order_index?: number;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      workouts: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          routine_id: string | null;
          started_at: string;
          total_volume: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          routine_id?: string | null;
          started_at?: string;
          total_volume?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          routine_id?: string | null;
          started_at?: string;
          total_volume?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workouts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      finish_workout: {
        Args: { p_workout_id: string };
        Returns: {
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          routine_id: string | null;
          started_at: string;
          total_volume: number;
          user_id: string;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals['public'];

export type Tables<TableName extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][TableName]['Row'];

export type TablesInsert<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Insert'];

export type TablesUpdate<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Update'];
