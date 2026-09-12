import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateStats, compareTypedText, getErrorMap, type TypingStats } from '@/lib/typing';

export type TypingSessionOptions = {
  target: string;
  durationMs?: number;
  completeOnTarget?: boolean;
  onComplete?: (stats: TypingStats, target: string, typed: string) => void;
};

export type TypingSession = {
  value: string;
  elapsedMs: number;
  running: boolean;
  done: boolean;
  mistakes: number;
  stats: TypingStats;
  errors: Record<string, number>;
  currentChar: string;
  progress: number;
  reset: () => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputValue: (nextValue: string) => void;
};

export function useTypingSession({ target, durationMs = 60_000, completeOnTarget = false, onComplete }: TypingSessionOptions): TypingSession {
  const [value, setValue] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const [historicalErrors, setHistoricalErrors] = useState<Record<string, number>>({});
  const startedAtRef = useRef<number | null>(null);
  const valueRef = useRef('');
  const mistakesRef = useRef(0);
  const completedRef = useRef(false);
  const sampleAtRef = useRef(0);
  const targetRef = useRef(target);
  const samplesRef = useRef<number[]>([]);
  const onCompleteRef = useRef(onComplete);
  targetRef.current = target;
  onCompleteRef.current = onComplete;

  const finish = useCallback((finalElapsed: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const typed = valueRef.current;
    const comparison = compareTypedText(targetRef.current, typed);
    const finalStats = calculateStats(comparison.correct, comparison.incorrect, finalElapsed, samplesRef.current, mistakesRef.current);
    setElapsedMs(finalElapsed);
    setRunning(false);
    setDone(true);
    onCompleteRef.current?.(finalStats, targetRef.current, typed);
  }, []);

  useEffect(() => {
    if (!running || startedAtRef.current === null) return;
    const tick = () => {
      const elapsed = Math.min(Date.now() - (startedAtRef.current ?? Date.now()), durationMs);
      setElapsedMs(elapsed);
      if (elapsed - sampleAtRef.current >= 500) {
        sampleAtRef.current = elapsed;
        const comparison = compareTypedText(targetRef.current, valueRef.current);
        const sample = calculateStats(comparison.correct, comparison.incorrect, Math.max(1, elapsed)).grossWpm;
        samplesRef.current = [...samplesRef.current, sample];
        setSamples(samplesRef.current);
      }
      if (elapsed >= durationMs) finish(elapsed);
    };
    tick();
    const timer = window.setInterval(tick, 50);
    return () => window.clearInterval(timer);
  }, [durationMs, finish, running]);

  const startIfNeeded = useCallback(() => {
    if (startedAtRef.current !== null || done) return;
    startedAtRef.current = Date.now();
    completedRef.current = false;
    setRunning(true);
    setElapsedMs(0);
  }, [done]);

  const appendCharacters = useCallback((characters: string) => {
    if (done) return;
    startIfNeeded();
    let nextValue = valueRef.current;
    let nextMistakes = mistakesRef.current;
    const nextErrors = { ...historicalErrors };
    for (const char of characters) {
      if (char.length !== 1) continue;
      const expected = targetRef.current[nextValue.length];
      if (char !== expected) {
        nextMistakes += 1;
        const key = (expected ?? char).toLowerCase();
        nextErrors[key] = (nextErrors[key] ?? 0) + 1;
      }
      nextValue += char;
      if (completeOnTarget && nextValue.length >= targetRef.current.length) break;
    }
    valueRef.current = nextValue;
    mistakesRef.current = nextMistakes;
    setValue(nextValue);
    setMistakes(nextMistakes);
    setHistoricalErrors(nextErrors);
    if (completeOnTarget && nextValue.length >= targetRef.current.length) {
      finish(Math.min(Date.now() - (startedAtRef.current ?? Date.now()), durationMs));
    }
  }, [completeOnTarget, done, finish, historicalErrors, startIfNeeded, durationMs]);

  const removeCharacter = useCallback(() => {
    if (done) return;
    valueRef.current = valueRef.current.slice(0, -1);
    setValue(valueRef.current);
  }, [done]);

  const handleInputValue = useCallback((nextValue: string) => {
    if (done) return;
    const current = valueRef.current;
    if (nextValue.length < current.length) {
      valueRef.current = nextValue;
      setValue(nextValue);
      return;
    }
    if (nextValue.length > current.length) appendCharacters(nextValue.slice(current.length));
  }, [appendCharacters, done]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (done) return;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      if (['v', 'c', 'x', 'a'].includes(event.key.toLowerCase())) event.preventDefault();
      return;
    }
    if (['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      removeCharacter();
      return;
    }
    if (event.key.length !== 1) return;
    event.preventDefault();
    appendCharacters(event.key);
  }, [appendCharacters, done, removeCharacter]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    valueRef.current = '';
    mistakesRef.current = 0;
    completedRef.current = false;
    sampleAtRef.current = 0;
    samplesRef.current = [];
    setValue('');
    setElapsedMs(0);
    setRunning(false);
    setDone(false);
    setMistakes(0);
    setSamples([]);
    setHistoricalErrors({});
  }, []);

  const comparison = useMemo(() => compareTypedText(target, value), [target, value]);
  const stats = useMemo(() => calculateStats(comparison.correct, comparison.incorrect, elapsedMs, samples, mistakes), [comparison, elapsedMs, mistakes, samples]);
  const errors = useMemo(() => historicalErrors, [historicalErrors]);

  return {
    value,
    elapsedMs,
    running,
    done,
    mistakes,
    stats,
    errors,
    currentChar: target[value.length] ?? '',
    progress: target.length ? Math.min(100, (value.length / target.length) * 100) : 0,
    reset,
    handleKeyDown,
    handleInputValue,
  };
}
