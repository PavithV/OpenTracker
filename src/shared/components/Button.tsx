import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/shared/theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';
type Color = 'default' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  color?: Color;
  disabled?: boolean;
  loading?: boolean;
}

// iOS-redesign buttons are filled, reversing Nocturne's "outline, never a fill" rule: `primary`
// is a solid accent fill with a white label (mockup: "Start"/"Start Empty Workout"), `secondary`
// is a filled neutral surface instead of an outline (mockup: "Records"/"Reminders" rows).
// `destructive` stays a solid danger fill (unchanged -- had no Nocturne equivalent either).
const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary-light dark:bg-primary-dark active:opacity-80',
  secondary: 'bg-surface-raised-light dark:bg-surface-raised-dark active:opacity-70',
  ghost: 'bg-transparent active:bg-primary-light/15 dark:active:bg-primary-dark/15',
  destructive: 'bg-danger active:opacity-90',
};

const labelClasses: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-text-primary-light dark:text-text-primary-dark',
  ghost: 'text-primary-light dark:text-primary-dark',
  destructive: 'text-danger-foreground',
};

// `sm` renders as a pill (mockup's compact "Start" chip on RoutineCard); `md`/`lg` render as a
// large rounded block (mockup's full-width "Start Empty Workout"/"Workout beenden").
const radiusClasses: Record<Size, string> = {
  sm: 'rounded-full',
  md: 'rounded-xl',
  lg: 'rounded-xl',
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

// `ghost` + `color="danger"` covers the mockup's text-only "Sign Out" row -- a separate variant
// isn't needed since it only ever swaps the label/press-tint color, not the (transparent) fill.
const dangerLabelClass = 'text-danger';
const dangerSpinnerColor = colors.danger;

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  color = 'default',
  disabled,
  loading,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isDanger = color === 'danger' && variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center ${radiusClasses[size]} ${sizeClasses[size]} ${variantClasses[variant]} ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={isDanger ? dangerSpinnerColor : spinnerColor[variant]} />
      ) : (
        <Text
          className={`font-sans-medium ${labelSizeClasses[size]} ${isDanger ? dangerLabelClass : labelClasses[variant]}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
