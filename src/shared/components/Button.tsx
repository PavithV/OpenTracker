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

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary:
    'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark active:opacity-70',
  ghost: 'bg-transparent active:opacity-60',
  destructive: 'bg-danger active:opacity-90',
};

const labelClasses: Record<Variant, string> = {
  primary: 'text-white',
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
  primary: '#FFFFFF',
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
        <Text className={`font-semibold ${labelSizeClasses[size]} ${labelClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
