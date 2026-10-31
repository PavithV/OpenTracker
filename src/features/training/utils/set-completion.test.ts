import { describe, expect, it } from 'vitest';

import { toggleSetCompletion } from './set-completion';

const base = { id: 'a', weight: 60, reps: null, completed: false };

describe('toggleSetCompletion', () => {
  it('fills empty reps from the routine target when ticking off', () => {
    expect(toggleSetCompletion({ ...base, targetReps: 8 })).toEqual({
      ...base,
      targetReps: 8,
      reps: 8,
      completed: true,
    });
  });

  it('keeps reps the user typed', () => {
    expect(toggleSetCompletion({ ...base, reps: 6, targetReps: 8 }).reps).toBe(6);
  });

  it('leaves reps empty without a target', () => {
    expect(toggleSetCompletion(base)).toEqual({ ...base, completed: true });
  });

  it('un-ticking keeps the values', () => {
    expect(toggleSetCompletion({ ...base, reps: 8, targetReps: 8, completed: true })).toEqual({
      ...base,
      reps: 8,
      targetReps: 8,
      completed: false,
    });
  });
});
