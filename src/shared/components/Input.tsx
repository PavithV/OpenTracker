import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, className, ...props }, ref) => {
  return (
    <View className="gap-xs">
      {label ? <Text className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#9C9CA8"
        className={`rounded-md border px-md py-md text-base text-text-primary-light dark:text-text-primary-dark ${
          error ? 'border-danger' : 'border-border-light dark:border-border-dark'
        } bg-white dark:bg-surface-dark ${className ?? ''}`}
        {...props}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';
