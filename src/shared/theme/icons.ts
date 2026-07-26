/**
 * Consistent icon sizing — avoid mixing arbitrary values (20/24/28) across screens.
 * Icon library is exclusively `phosphor-react-native` (Nocturne design system).
 */
export const ICON_SIZE = {
  sm: 18,
  md: 20,
  lg: 24,
} as const;

// Base content height of the floating (position: 'absolute') bottom tab bar in
// `app/(tabs)/_layout.tsx`, excluding the safe-area bottom inset (add
// `useSafeAreaInsets().bottom` on top). `@react-navigation/bottom-tabs`'s own
// `useBottomTabBarHeight()` isn't reliably importable here -- it's only vendored inside
// expo-router's build output, not published as a top-level dependency of this project -- so tab
// screens pad their bottom-most content by this approximation instead. Sized generously (default
// iOS tab bar content is ~49px) to comfortably clear the icon+label bar; adjust if it looks off
// on-device.
export const TAB_BAR_CLEARANCE_BASE = 60;
