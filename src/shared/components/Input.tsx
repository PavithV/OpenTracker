import { forwardRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const borderClass = error
      ? 'border-danger'
      : isFocused
        ? 'border-primary'
        : 'border-border-light dark:border-border-dark';

    return (
      <View className="gap-xs">
        {label ? (
          <Text className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#9C9CA8"
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          className={`rounded-md border px-md py-md text-base text-text-primary-light dark:text-text-primary-dark ${borderClass} bg-white dark:bg-surface-dark ${className ?? ''}`}
          {...props}
        />
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      </View>
    );
  },
);
Input.displayName = 'Input';
