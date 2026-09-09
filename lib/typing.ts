export type TypingStats = {
  elapsedMs: number;
  correct: number;
  incorrect: number;
  typed: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  consistency: number;
};

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

export function calculateWpm(characters: number, elapsedMs: number): number {
  const chars = Math.max(0, finite(characters));
  const elapsed = Math.max(0, finite(elapsedMs));
  if (!chars || !elapsed) return 0;
  return (chars / 5) / (elapsed / 60_000);
}

export function calculateConsistency(samples: number[]): number {
  if (samples.length < 2) return samples.length ? 100 : 0;
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  if (!mean) return 0;
  const variance = samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length;
  return Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / mean) * 100));
}

export function calculateStats(correct: number, incorrect: number, elapsedMs: number, samples: number[] = []): TypingStats {
  const right = Math.max(0, finite(correct));
  const wrong = Math.max(0, finite(incorrect));
  const typed = right + wrong;
  const elapsed = Math.max(0, finite(elapsedMs));
  const grossWpm = calculateWpm(typed, elapsed);
  const penalty = calculateWpm(wrong, elapsed);
  const netWpm = Math.max(0, grossWpm - penalty);
  const accuracy = typed ? Math.min(100, Math.max(0, (right / typed) * 100)) : 100;
  return {
    elapsedMs: elapsed, correct: right, incorrect: wrong, typed,
    grossWpm, netWpm, accuracy, errors: wrong,
    consistency: calculateConsistency(samples.length ? samples : [grossWpm]),
  };
}

export function compareTypedText(target: string, value: string) {
  const targetChars = [...target];
  const chars = [...value];
  let correct = 0;
  let incorrect = 0;
  chars.forEach((char, index) => char === targetChars[index] ? correct++ : incorrect++);
  return { correct, incorrect };
}

export function getErrorMap(target: string, value: string) {
  const targetChars = [...target];
  const errors: Record<string, number> = {};
  [...value].forEach((char, index) => {
    const expected = targetChars[index];
    if (expected && char !== expected) errors[expected.toLowerCase()] = (errors[expected.toLowerCase()] ?? 0) + 1;
  });
  return errors;
}
