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
};

export function useTypingSession({ target, durationMs = 60_000, completeOnTarget = false, onComplete }: TypingSessionOptions): TypingSession {
  const [value, setValue] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const valueRef = useRef('');
  const mistakesRef = useRef(0);
  const completedRef = useRef(false);
  const sampleAtRef = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  const finish = useCallback((finalElapsed: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const typed = valueRef.current;
    const comparison = compareTypedText(targetRef.current, typed);
    const finalStats = calculateStats(comparison.correct, comparison.incorrect, finalElapsed, samples, mistakesRef.current);
    setElapsedMs(finalElapsed);
    setRunning(false);
    setDone(true);
    onComplete?.(finalStats, targetRef.current, typed);
  }, [onComplete, samples]);

  useEffect(() => {
    if (!running || startedAtRef.current === null) return;
    const tick = () => {
      const elapsed = Math.min(Date.now() - (startedAtRef.current ?? Date.now()), durationMs);
      setElapsedMs(elapsed);
      if (elapsed - sampleAtRef.current >= 500) {
        sampleAtRef.current = elapsed;
        const comparison = compareTypedText(targetRef.current, valueRef.current);
        setSamples((current) => [...current, calculateStats(comparison.correct, comparison.incorrect, Math.max(1, elapsed)).grossWpm]);
      }
      if (elapsed >= durationMs) finish(elapsed);
    };
    tick();
    const timer = window.setInterval(tick, 50);
    return () => window.clearInterval(timer);
  }, [durationMs, finish, running]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    valueRef.current = '';
    mistakesRef.current = 0;
    completedRef.current = false;
    sampleAtRef.current = 0;
    setValue('');
    setElapsedMs(0);
    setRunning(false);
    setDone(false);
    setMistakes(0);
    setSamples([]);
  }, []);

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
      valueRef.current = valueRef.current.slice(0, -1);
      setValue(valueRef.current);
      return;
    }
    if (event.key.length !== 1) return;
    event.preventDefault();
    if (!running && !startedAtRef.current) {
      startedAtRef.current = Date.now();
      completedRef.current = false;
      setRunning(true);
      setElapsedMs(0);
    }
    const expected = targetRef.current[valueRef.current.length];
    if (event.key !== expected) {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
    }
    valueRef.current += event.key;
    setValue(valueRef.current);
    if (completeOnTarget && valueRef.current.length >= targetRef.current.length) {
      finish(Math.min(Date.now() - (startedAtRef.current ?? Date.now()), durationMs));
    }
  }, [completeOnTarget, done, durationMs, finish, running]);

  const comparison = useMemo(() => compareTypedText(target, value), [target, value]);
  const stats = useMemo(() => calculateStats(comparison.correct, comparison.incorrect, elapsedMs, samples, mistakes), [comparison, elapsedMs, mistakes, samples]);
  const errors = useMemo(() => getErrorMap(target, value), [target, value]);

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
  };
}
