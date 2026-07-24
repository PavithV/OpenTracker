import { Text, type TextProps } from 'react-native';

type Variant = 'title' | 'cardTitle' | 'subtitle' | 'body' | 'label' | 'caption';
type Color = 'default' | 'muted' | 'tertiary' | 'danger';

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

// Nocturne caps every weight at 500 ("Don't bolden headings past their 500 weight -- hierarchy
// here is size and space") -- title/cardTitle/label use font-sans-medium (Inter_500Medium),
// nothing here goes to sans-semibold/sans-bold.
const variantClasses: Record<Variant, string> = {
  title: 'text-2xl font-sans-medium tracking-tight',
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
