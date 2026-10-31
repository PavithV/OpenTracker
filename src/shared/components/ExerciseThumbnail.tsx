import { Image, View } from 'react-native';

import { Typography } from './Typography';

const SIZE_CLASS = { md: 'h-12 w-12', sm: 'h-10 w-10' } as const;

interface ExerciseThumbnailProps {
  /** Its first letter is shown when there is no image. */
  name: string;
  imageUrl: string | null | undefined;
  size?: keyof typeof SIZE_CLASS;
}

// Round exercise image, or the name's initial on an accent circle when there is none. Previously
// copied into six components (PRODUCT_AUDIT.md roadmap #32).
export function ExerciseThumbnail({ name, imageUrl, size = 'md' }: ExerciseThumbnailProps) {
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} className={`${SIZE_CLASS[size]} rounded-full`} />;
  }
  return (
    <View
      className={`${SIZE_CLASS[size]} items-center justify-center rounded-full bg-primary-light/15 dark:bg-primary-dark/15`}
    >
      <Typography variant="label" color="accent">
        {name.charAt(0).toUpperCase()}
      </Typography>
    </View>
  );
}
