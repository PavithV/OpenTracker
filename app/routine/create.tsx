import { useQueryClient } from '@tanstack/react-query';

import { createRoutine } from '@/features/routines/api/routines.api';
import { RoutineForm } from '@/features/routines/components/RoutineForm';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

export default function CreateRoutineScreen() {
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();

  return (
    <Screen>
      <Typography variant="title" className="py-md">
        Routine erstellen
      </Typography>
      <RoutineForm
        onSave={async (name, notes, exercises) => {
          await createRoutine(session!.user.id, name, notes, exercises);
          queryClient.invalidateQueries({ queryKey: ['routines', 'list'] });
        }}
      />
    </Screen>
  );
}
