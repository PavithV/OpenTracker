import { useState } from 'react';

import { BarChart } from '@/shared/components/BarChart';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { capitalize } from '@/shared/utils/format';

import type { WorkoutDetailExercise } from '../types/workout-detail.types';
import { computeWorkoutMuscleSplit } from '../utils/muscle-split';

const VISIBLE_COUNT = 3;

export function WorkoutMuscleSplitCard({ exercises }: { exercises: WorkoutDetailExercise[] }) {
  const [expanded, setExpanded] = useState(false);
  const entries = computeWorkoutMuscleSplit(exercises);

  if (entries.length === 0) return null;

  const visibleEntries = expanded ? entries : entries.slice(0, VISIBLE_COUNT);
  const remainingCount = entries.length - visibleEntries.length;

  return (
    <Card>
      <Typography variant="cardTitle" className="mb-sm">
        Muskel-Split
      </Typography>
      <BarChart
        data={visibleEntries.map((entry) => ({ label: capitalize(entry.muscle), value: entry.percentage }))}
        formatValue={(value) => `${Math.round(value)}%`}
      />
      {remainingCount > 0 ? (
        <Button
          label={`Zeige ${remainingCount} mehr`}
          variant="ghost"
          size="sm"
          onPress={() => setExpanded(true)}
        />
      ) : null}
    </Card>
  );
}
