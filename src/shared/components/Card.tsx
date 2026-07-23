import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';

type Variant = 'default' | 'elevated';

interface CardProps extends PropsWithChildren {
  variant?: Variant;
  onPress?: () => void;
}

const variantClasses: Record<Variant, string> = {
  default: 'border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark',
  elevated: 'bg-surface-raised-light dark:bg-surface-raised-dark shadow-md',
};

export function Card({ children, variant = 'default', onPress }: CardProps) {
  const className = `rounded-lg p-md ${variantClasses[variant]}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${className} active:opacity-70`}>
        {children}
      </Pressable>
    );
  }

  return <View className={className}>{children}</View>;
}
