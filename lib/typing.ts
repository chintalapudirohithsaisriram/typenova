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
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calculateWpm(characters: number, elapsedMs: number): number {
  const chars = Math.max(0, finite(characters));
  const elapsed = Math.max(0, finite(elapsedMs));
  if (!chars || !elapsed) return 0;
  return (chars / 5) / (elapsed / 60_000);
}

export function calculateConsistency(samples: number[]): number {
  const clean = samples.filter((value) => Number.isFinite(value) && value >= 0);
  if (clean.length < 2) return clean.length ? 100 : 0;
  const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  if (!mean) return 0;
  const variance = clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / clean.length;
  return clamp(100 - (Math.sqrt(variance) / mean) * 100, 0, 100);
}

export function calculateStats(
  correct: number,
  incorrect: number,
  elapsedMs: number,
  samples: number[] = [],
  errorCount = incorrect,
): TypingStats {
  const right = Math.max(0, finite(correct));
  const wrong = Math.max(0, finite(incorrect));
  const typed = right + wrong;
  const elapsed = Math.max(0, finite(elapsedMs));
  const errors = Math.max(0, finite(errorCount));
  const grossWpm = calculateWpm(typed, elapsed);
  const penalty = calculateWpm(errors, elapsed);
  const netWpm = Math.max(0, grossWpm - penalty);
  const accuracy = typed ? clamp((right / typed) * 100, 0, 100) : 100;

  return {
    elapsedMs: elapsed,
    correct: right,
    incorrect: wrong,
    typed,
    grossWpm,
    netWpm,
    accuracy,
    errors,
    consistency: calculateConsistency(samples.length ? samples : [grossWpm]),
  };
}

export function compareTypedText(target: string, value: string) {
  const targetChars = [...target];
  const chars = [...value];
  let correct = 0;
  let incorrect = 0;
  chars.forEach((char, index) => (char === targetChars[index] ? correct++ : incorrect++));
  return { correct, incorrect };
}

export function getErrorMap(target: string, value: string) {
  const targetChars = [...target];
  const errors: Record<string, number> = {};
  [...value].forEach((char, index) => {
    const expected = targetChars[index];
    if (expected && char !== expected) {
      const key = expected.toLowerCase();
      errors[key] = (errors[key] ?? 0) + 1;
    }
  });
  return errors;
}
