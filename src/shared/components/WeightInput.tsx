import { useState } from 'react';

import {
  formatWeightInputValue,
  parseWeightInput,
  type UnitPreference,
} from '@/shared/utils/units';

import { Input, type InputProps } from './Input';

interface WeightInputProps extends Omit<InputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  /** Canonical kg value from the store (null = empty). */
  weightKg: number | null;
  unit: UnitPreference;
  onChangeWeightKg: (weightKg: number | null) => void;
}

// A weight field must keep the user's raw text while they type. Rendering the stored number back
// into the field on every keystroke (the previous approach) turned "62." into "62", so typing
// "62.5" produced 625 kg -- and a decimal comma cleared the field entirely.
//
// The field owns its text; it only re-derives it from `weightKg` when that value changes from the
// outside (prefill from a routine, unit switch, reset) -- i.e. when the stored value no longer
// matches what the current text parses to.
export function WeightInput({ weightKg, unit, onChangeWeightKg, ...props }: WeightInputProps) {
  const [text, setText] = useState(() => formatWeightInputValue(weightKg, unit));
  const [synced, setSynced] = useState({ weightKg, unit });

  if (synced.weightKg !== weightKg || synced.unit !== unit) {
    setSynced({ weightKg, unit });
    if (parseWeightInput(text, unit) !== weightKg) setText(formatWeightInputValue(weightKg, unit));
  }

  return (
    <Input
      {...props}
      keyboardType="decimal-pad"
      value={text}
      onChangeText={(nextText) => {
        setText(nextText);
        onChangeWeightKg(parseWeightInput(nextText, unit));
      }}
    />
  );
}
