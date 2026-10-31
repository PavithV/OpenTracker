import type { QueryClient } from '@tanstack/react-query';

// Every cached query whose data is derived from the user's finished workouts. Finishing or
// deleting a workout must refresh all of them -- previously finishing a workout invalidated
// nothing, so Home still showed "Noch keine Workouts" (and profile stats, records, calendar and
// exercise history stayed stale) until the 30 s staleTime ran out and the screen refetched.
export function invalidateWorkoutDerivedQueries(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['workouts'] }),
    queryClient.invalidateQueries({ queryKey: ['profile'] }),
    queryClient.invalidateQueries({ queryKey: ['records'] }),
    queryClient.invalidateQueries({ queryKey: ['exercises', 'personal-records'] }),
    queryClient.invalidateQueries({ queryKey: ['exercises', 'history'] }),
    queryClient.invalidateQueries({ queryKey: ['exercises', 'previous-sets'] }),
  ]);
}
