import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';

type Variant = 'default' | 'elevated';

interface CardProps extends PropsWithChildren {
  variant?: Variant;
  onPress?: () => void;
}

// iOS-redesign cards are a filled surface with a soft shadow, not a bordered outline (mockup:
// every card uses `theme.cardShadow`, no border) -- RN can't reproduce the mockup's two-layer
// CSS shadow, so this falls back to NativeWind's standard `shadow-sm`/`shadow-md` (platform
// shadow props), same known simplification as Nocturne's `elevated` variant made before it.
const variantClasses: Record<Variant, string> = {
  default: 'bg-surface-light dark:bg-surface-dark shadow-sm',
  elevated: 'bg-surface-raised-light dark:bg-surface-raised-dark shadow-md',
};

export function Card({ children, variant = 'default', onPress }: CardProps) {
  const className = `rounded-xl p-md ${variantClasses[variant]}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" className={`${className} active:opacity-70`}>
        {children}
      </Pressable>
    );
  }

  return <View className={className}>{children}</View>;
}
