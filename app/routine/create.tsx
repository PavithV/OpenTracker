import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function CreateRoutineScreen() {
  // TODO (Phase 2): Name, Übungsauswahl (siehe exercise/picker), Reihenfolge, Soll-Werte.
  return (
    <Screen>
      <Typography variant="title" className="pt-md">
        Routine erstellen
      </Typography>
    </Screen>
  );
}
