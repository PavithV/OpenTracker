import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/shared/theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
}

// Nocturne buttons are outlined, never solid-filled ("the primary is an accent outline, never a
// fill") -- press tints come from the accent/text ramp via Tailwind's color-opacity modifiers,
// matching styles.css's color-mix(accent 22%)/color-mix(text 14%) active states. `destructive`
// has no Nocturne equivalent (the system defines no danger role) -- kept as a solid danger fill
// so destructive actions stay visually distinct from the calmer outlined actions everywhere else.
const variantClasses: Record<Variant, string> = {
  primary: 'border border-primary bg-transparent active:bg-primary/20',
  secondary:
    'border border-border-light dark:border-border-dark bg-transparent active:bg-text-primary-light/10 dark:active:bg-text-primary-dark/10',
  ghost: 'bg-transparent active:bg-primary/15',
  destructive: 'bg-danger active:opacity-90',
};

const labelClasses: Record<Variant, string> = {
  primary: 'text-primary',
  secondary: 'text-text-primary-light dark:text-text-primary-dark',
  ghost: 'text-primary',
  destructive: 'text-danger-foreground',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-md py-xs',
  md: 'px-lg py-md',
  lg: 'px-xl py-md',
};

const labelSizeClasses: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const spinnerColor: Record<Variant, string> = {
  primary: colors.primary.DEFAULT,
  secondary: colors.primary.DEFAULT,
  ghost: colors.primary.DEFAULT,
  destructive: '#FFFFFF',
};

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center rounded-md ${sizeClasses[size]} ${variantClasses[variant]} ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        <Text className={`font-sans-medium ${labelSizeClasses[size]} ${labelClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
