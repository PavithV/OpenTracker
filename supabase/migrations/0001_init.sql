-- Initial schema for OpenTracker. Mirrors DATABASE.md.
-- Apply with: npx supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ============================================================================
-- profiles (1:1 with auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  unit_preference text not null default 'kg' check (unit_preference in ('kg', 'lb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- exercises
-- ============================================================================
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  category text not null check (category in (
    'back', 'cardio', 'chest', 'lower arms', 'lower legs',
    'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
  )),
  equipment text not null,
  target_muscle text not null,
  secondary_muscles text[] not null default '{}',
  instructions jsonb not null default '{}'::jsonb,
  image_url text,
  gif_url text,
  attribution text,
  is_custom boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint custom_exercise_requires_owner check (
    (is_custom = false and created_by is null) or (is_custom = true and created_by is not null)
  )
);

create index exercises_category_idx on public.exercises (category);
create index exercises_secondary_muscles_idx on public.exercises using gin (secondary_muscles);

-- ============================================================================
-- routines
-- ============================================================================
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index int not null,
  target_sets int not null default 3,
  target_reps_min int not null default 8,
  target_reps_max int,
  target_weight numeric,
  rest_seconds int
);

create index routine_exercises_routine_order_idx on public.routine_exercises (routine_id, order_index);

-- ============================================================================
-- workouts
-- ============================================================================
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  total_volume numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index int not null,
  notes text
);

-- ============================================================================
-- sets
-- ============================================================================
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number int not null,
  set_type text not null default 'working' check (set_type in ('warmup', 'working', 'dropset', 'failure')),
  weight numeric,
  reps int,
  duration_seconds int,
  rpe numeric,
  completed boolean not null default false,
  completed_at timestamptz
);

create index sets_workout_exercise_idx on public.sets (workout_exercise_id);

-- ============================================================================
-- personal_records
-- ============================================================================
create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  record_type text not null check (record_type in ('max_weight', 'max_volume', 'max_reps', 'estimated_1rm')),
  value numeric not null,
  set_id uuid references public.sets (id) on delete set null,
  achieved_at timestamptz not null default now(),
  unique (user_id, exercise_id, record_type)
);

-- ============================================================================
-- finish_workout: computes total_volume/duration_seconds and refreshes
-- personal_records server-side so the logic is never duplicated client-side.
-- ============================================================================
create function public.finish_workout(p_workout_id uuid)
returns public.workouts
language plpgsql
security definer set search_path = public
as $$
declare
  v_workout public.workouts;
  v_user_id uuid;
begin
  select user_id into v_user_id from public.workouts where id = p_workout_id;
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  update public.workouts w
  set
    ended_at = now(),
    duration_seconds = extract(epoch from (now() - w.started_at))::int,
    total_volume = coalesce((
      select sum(s.weight * s.reps)
      from public.sets s
      join public.workout_exercises we on we.id = s.workout_exercise_id
      where we.workout_id = w.id and s.completed = true and s.weight is not null and s.reps is not null
    ), 0)
  where w.id = p_workout_id
  returning * into v_workout;

  insert into public.personal_records (user_id, exercise_id, record_type, value, set_id, achieved_at)
  select
    v_user_id,
    we.exercise_id,
    'max_weight',
    s.weight,
    s.id,
    s.completed_at
  from public.sets s
  join public.workout_exercises we on we.id = s.workout_exercise_id
  where we.workout_id = p_workout_id and s.completed = true and s.weight is not null
  on conflict (user_id, exercise_id, record_type) do update
    set value = excluded.value, set_id = excluded.set_id, achieved_at = excluded.achieved_at
    where excluded.value > public.personal_records.value;

  return v_workout;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;
alter table public.personal_records enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

create policy "exercises are readable by everyone" on public.exercises
  for select using (true);
create policy "custom exercises are owner-writable" on public.exercises
  for insert with check (is_custom = true and created_by = auth.uid());
create policy "custom exercises are owner-updatable" on public.exercises
  for update using (is_custom = true and created_by = auth.uid());
create policy "custom exercises are owner-deletable" on public.exercises
  for delete using (is_custom = true and created_by = auth.uid());

create policy "routines are owner-only" on public.routines
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "routine_exercises follow parent routine" on public.routine_exercises
  for all using (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );

create policy "workouts are owner-only" on public.workouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "workout_exercises follow parent workout" on public.workout_exercises
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

create policy "sets follow parent workout" on public.sets
  for all using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

create policy "personal_records are owner-only" on public.personal_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
