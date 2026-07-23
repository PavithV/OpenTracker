import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function ActiveWorkoutScreen() {
  // TODO (Phase 2): Timer, Gesamtvolumen, Satz-Erfassung pro Übung — siehe MVP.md "Training".
  return (
    <Screen>
      <Typography variant="title" className="pt-md">
        Aktives Workout
      </Typography>
    </Screen>
  );
}
