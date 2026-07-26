import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Typography } from './Typography';

interface ListItemProps {
  title: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
}

export function ListItem({ title, description, leading, trailing, onPress }: ListItemProps) {
  const content = (
    <View className="flex-row items-center gap-md py-sm">
      {leading}
      <View className="flex-1 gap-xs">
        <Typography variant="body">{title}</Typography>
        {description ? <Typography variant="subtitle">{description}</Typography> : null}
      </View>
      {trailing}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-60">
        {content}
      </Pressable>
    );
  }

  return content;
}
