import { Text, type TextProps } from 'react-native';

type Variant = 'title' | 'cardTitle' | 'subtitle' | 'body' | 'label' | 'caption';
type Color = 'default' | 'muted' | 'tertiary' | 'danger';

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

const variantClasses: Record<Variant, string> = {
  title: 'text-2xl font-bold',
  cardTitle: 'text-lg font-semibold',
  subtitle: 'text-sm',
  body: 'text-base',
  label: 'text-sm font-medium',
  caption: 'text-xs',
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
