import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { createCustomExercise } from '@/features/exercises/api/exercises.api';
import { CustomExerciseForm } from '@/features/exercises/components/CustomExerciseForm';
import { useRoutineDraftStore } from '@/features/routines/store/routine-draft.store';
import { useActiveWorkoutStore } from '@/features/training/store/active-workout.store';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

export default function CreateCustomExerciseScreen() {
  const { target, search } = useLocalSearchParams<{ target?: string; search?: string }>();
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();
  const addExercisesToRoutineDraft = useRoutineDraftStore((state) => state.addExercises);
  const addExercisesToWorkoutDraft = useActiveWorkoutStore((state) => state.addExercises);

  return (
    <Screen>
      <Typography variant="title" className="py-md">
        Eigene Übung erstellen
      </Typography>
      <CustomExerciseForm
        initialName={search ?? ''}
        onSave={async (input) => {
          const created = await createCustomExercise(session!.user.id, input);
          queryClient.invalidateQueries({ queryKey: ['exercises'] });
          if (target === 'workout') {
            addExercisesToWorkoutDraft([{ id: created.id, name: created.name }]);
          } else {
            addExercisesToRoutineDraft([{ id: created.id, name: created.name, imageUrl: created.imageUrl }]);
          }
          router.back();
        }}
      />
    </Screen>
  );
}
