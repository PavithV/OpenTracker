import { forwardRef, useState } from 'react';
import { Text, TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { colors } from '@/shared/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

    const borderClass = error
      ? 'border-danger'
      : isFocused
        ? 'border-primary-light dark:border-primary-dark'
        : 'border-border-light dark:border-border-dark';

    return (
      <View className="gap-xs">
        {label ? (
          <Text className="text-sm font-sans-medium text-text-secondary-light dark:text-text-secondary-dark">
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary[scheme]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          className={`rounded-lg border px-md py-md font-sans text-base text-text-primary-light dark:text-text-primary-dark ${borderClass} bg-surface-light dark:bg-surface-dark ${className ?? ''}`}
          {...props}
        />
        {error ? <Text className="text-sm font-sans text-danger">{error}</Text> : null}
      </View>
    );
  },
);
Input.displayName = 'Input';
