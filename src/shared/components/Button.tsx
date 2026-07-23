import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark',
  ghost: 'bg-transparent',
};

const labelClasses: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-text-primary-light dark:text-text-primary-dark',
  ghost: 'text-primary',
};

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center rounded-md px-lg py-md ${variantClasses[variant]} ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#6C5CE7'} />
      ) : (
        <Text className={`text-base font-semibold ${labelClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
