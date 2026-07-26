import { Pressable, View } from 'react-native';

import { Typography } from '@/shared/components/Typography';

export type ExerciseDetailTab = 'summary' | 'history' | 'howTo';

const TAB_LABELS: Record<ExerciseDetailTab, string> = {
  summary: 'Zusammenfassung',
  history: 'Historie',
  howTo: 'So geht’s',
};

const TABS: ExerciseDetailTab[] = ['summary', 'history', 'howTo'];

interface ExerciseDetailTabsProps {
  active: ExerciseDetailTab;
  onChange: (tab: ExerciseDetailTab) => void;
}

export function ExerciseDetailTabs({ active, onChange }: ExerciseDetailTabsProps) {
  return (
    <View className="flex-row border-b border-border-light dark:border-border-dark">
      {TABS.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          className={`flex-1 items-center border-b-2 py-sm ${
            active === tab ? 'border-primary-light dark:border-primary-dark' : 'border-transparent'
          }`}
        >
          <Typography variant="label" color={active === tab ? 'default' : 'muted'}>
            {TAB_LABELS[tab]}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}
