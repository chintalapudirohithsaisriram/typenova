export type TypingStats = {
  elapsedMs: number;
  correct: number;
  incorrect: number;
  typed: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
};

const safeNumber = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

export function calculateWpm(characters: number, elapsedMs: number): number {
  const chars = Math.max(0, Number.isFinite(characters) ? characters : 0);
  const elapsed = safeNumber(elapsedMs);
  if (!chars || !elapsed) return 0;
  return (chars / 5) / (elapsed / 60_000);
}

export function calculateStats(correct: number, incorrect: number, elapsedMs: number): TypingStats {
  const right = Math.max(0, Number.isFinite(correct) ? correct : 0);
  const wrong = Math.max(0, Number.isFinite(incorrect) ? incorrect : 0);
  const typed = right + wrong;
  const elapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const grossWpm = calculateWpm(typed, elapsed);
  const penalty = calculateWpm(wrong, elapsed);
  const netWpm = Math.max(0, grossWpm - penalty);
  const accuracy = typed ? Math.min(100, Math.max(0, (right / typed) * 100)) : 100;

  return {
    elapsedMs: elapsed,
    correct: right,
    incorrect: wrong,
    typed,
    grossWpm,
    netWpm,
    accuracy,
    errors: wrong,
  };
}

export function compareTypedText(target: string, value: string) {
  const chars = [...value];
  let correct = 0;
  let incorrect = 0;
  chars.forEach((char, index) => {
    if (char === [...target][index]) correct += 1;
    else incorrect += 1;
  });
  return { correct, incorrect };
}
