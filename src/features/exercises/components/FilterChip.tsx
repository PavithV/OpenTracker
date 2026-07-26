import { Pressable, Text } from 'react-native';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-md py-xs active:opacity-70 ${
        selected
          ? 'border-primary-light bg-primary-light/15 dark:border-primary-dark dark:bg-primary-dark/15'
          : 'border-border-light bg-transparent dark:border-border-dark'
      }`}
    >
      <Text
        className={`text-sm font-sans-medium ${
          selected
            ? 'text-primary-light dark:text-primary-dark'
            : 'text-text-secondary-light dark:text-text-secondary-dark'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
