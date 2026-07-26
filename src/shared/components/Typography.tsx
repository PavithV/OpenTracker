import { Text, type TextProps } from 'react-native';

type Variant = 'title' | 'cardTitle' | 'subtitle' | 'body' | 'label' | 'caption';
type Color = 'default' | 'muted' | 'tertiary' | 'danger' | 'accent';

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

// iOS-redesign large titles are bold (mockup: 34px/700) -- unlike Nocturne, which capped every
// weight at 500. Only `title` goes up to font-sans-bold (Inter_700Bold); cardTitle/label stay at
// font-sans-medium since the mockup's card/row text never goes past that weight either.
const variantClasses: Record<Variant, string> = {
  title: 'text-[34px] font-sans-bold tracking-tight',
  cardTitle: 'text-lg font-sans-medium',
  subtitle: 'text-sm font-sans',
  body: 'text-base font-sans',
  label: 'text-sm font-sans-medium',
  caption: 'text-xs font-sans',
};

const defaultColorForVariant: Record<Variant, Color> = {
  title: 'default',
  cardTitle: 'default',
  subtitle: 'muted',
  body: 'default',
  label: 'muted',
  caption: 'tertiary',
};

const colorClasses: Record<Color, string> = {
  default: 'text-text-primary-light dark:text-text-primary-dark',
  muted: 'text-text-secondary-light dark:text-text-secondary-dark',
  tertiary: 'text-text-tertiary-light dark:text-text-tertiary-dark',
  danger: 'text-danger',
  accent: 'text-primary-light dark:text-primary-dark',
};

export function Typography({ variant = 'body', color, className, children, ...props }: TypographyProps) {
  const resolvedColor = color ?? defaultColorForVariant[variant];
  return (
    <Text
      className={`${variantClasses[variant]} ${colorClasses[resolvedColor]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </Text>
  );
}
