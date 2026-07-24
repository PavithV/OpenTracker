-- Adds exercise favorites (Phase 4, item 5 -- Favorites, see TODO.md). Exercises only, per product
-- decision -- routines were considered but out of scope for this migration.
create table public.favorite_exercises (
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.favorite_exercises enable row level security;

create policy "favorite exercises are owner-only" on public.favorite_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
