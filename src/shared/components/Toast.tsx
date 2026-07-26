import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_CLEARANCE_BASE } from '@/shared/theme/icons';
import { useToastStore } from '@/store/toast.store';

import { Typography } from './Typography';

// Mounted once at the app root (app/_layout.tsx) so it survives navigation -- e.g. the
// workout-delete-undo flow calls router.back() immediately after showing this toast. Stays
// permanently in the tree (no mount/unmount) and just fades/toggles pointerEvents based on
// `visible`, avoiding extra state for tracking the exit-animation lifecycle.
export function Toast() {
  const visible = useToastStore((state) => state.visible);
  const message = useToastStore((state) => state.message);
  const actionLabel = useToastStore((state) => state.actionLabel);
  const onAction = useToastStore((state) => state.onAction);
  const hide = useToastStore((state) => state.hide);
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 150,
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: TAB_BAR_CLEARANCE_BASE + insets.bottom,
        alignItems: 'center',
        paddingHorizontal: 16,
      }}
    >
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}
        className="w-full max-w-md flex-row items-center justify-between gap-md rounded-xl bg-surface-raised-light px-md py-sm shadow-md dark:bg-surface-raised-dark"
      >
        <Typography variant="body" className="flex-1">
          {message}
        </Typography>
        {actionLabel && onAction ? (
          <Pressable
            onPress={() => {
              onAction();
              hide();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Typography variant="label" color="accent">
              {actionLabel}
            </Typography>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
