import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateStats, calculateWpm, compareTypedText, type TypingStats } from '@/lib/typing';

export type TypingSessionOptions = {
  target: string;
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
  handleVirtualKey: (key: string) => void;
};

export function useTypingSession({ target, completeOnTarget = false, onComplete }: TypingSessionOptions): TypingSession {
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
  const historicalErrorsRef = useRef<Record<string, number>>({});
  const onCompleteRef = useRef(onComplete);
  targetRef.current = target;
  onCompleteRef.current = onComplete;

  const finish = useCallback((finalElapsed: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const typed = valueRef.current;
    const comparison = compareTypedText(targetRef.current, typed);
    const finalSample = finalElapsed > 0 ? calculateWpm(typed.length, finalElapsed) : 0;
    const finalSamples = finalSample > 0 ? [...samplesRef.current, finalSample] : samplesRef.current;
    const finalStats = calculateStats(comparison.correct, comparison.incorrect, finalElapsed, finalSamples, mistakesRef.current);
    setElapsedMs(finalElapsed);
    setRunning(false);
    setDone(true);
    onCompleteRef.current?.(finalStats, targetRef.current, typed);
  }, []);

  useEffect(() => {
    if (!running || startedAtRef.current === null) return;
    const tick = () => {
      const elapsed = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
      setElapsedMs(elapsed);
      if (elapsed - sampleAtRef.current >= 500) {
        sampleAtRef.current = elapsed;
        const comparison = compareTypedText(targetRef.current, valueRef.current);
        const sample = calculateStats(comparison.correct, comparison.incorrect, Math.max(1, elapsed)).grossWpm;
        samplesRef.current = [...samplesRef.current, sample];
        setSamples(samplesRef.current);
      }
    };
    tick();
    const timer = window.setInterval(tick, 50);
    return () => window.clearInterval(timer);
  }, [running]);

  const startIfNeeded = useCallback(() => {
    if (startedAtRef.current !== null || done) return;
    startedAtRef.current = Date.now();
    completedRef.current = false;
    setRunning(true);
    setElapsedMs(0);
  }, [done]);

  const appendCharacters = useCallback((characters: string) => {
    if (done || !characters) return;
    startIfNeeded();
    let nextValue = valueRef.current;
    let nextMistakes = mistakesRef.current;
    const nextErrors = { ...historicalErrorsRef.current };
    const targetChars = [...targetRef.current];

    for (const char of [...characters]) {
      const expected = targetChars[[...nextValue].length];
      if (expected === undefined) break;
      if (char !== expected) {
        nextMistakes += 1;
        const key = expected.toLowerCase();
        nextErrors[key] = (nextErrors[key] ?? 0) + 1;
      }
      nextValue += char;
      if (completeOnTarget && [...nextValue].length >= targetChars.length) break;
    }

    valueRef.current = nextValue;
    mistakesRef.current = nextMistakes;
    historicalErrorsRef.current = nextErrors;
    setValue(nextValue);
    setMistakes(nextMistakes);
    setHistoricalErrors(nextErrors);

    if (completeOnTarget && [...nextValue].length >= targetChars.length) {
      finish(Math.max(0, Date.now() - (startedAtRef.current ?? Date.now())));
    }
  }, [completeOnTarget, done, finish, startIfNeeded]);

  const removeCharacter = useCallback(() => {
    if (done || !valueRef.current) return;
    valueRef.current = [...valueRef.current].slice(0, -1).join('');
    setValue(valueRef.current);
  }, [done]);

  const handleInputValue = useCallback((nextValue: string) => {
    if (done) return;
    const current = valueRef.current;
    if (nextValue === current) return;
    if (nextValue.length < current.length) {
      valueRef.current = nextValue;
      setValue(nextValue);
      return;
    }
    const delta = nextValue.startsWith(current) ? nextValue.slice(current.length) : nextValue;
    appendCharacters(delta);
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

  const handleVirtualKey = useCallback((key: string) => {
    if (key === 'Backspace') removeCharacter();
    else if ([...key].length === 1) appendCharacters(key);
  }, [appendCharacters, removeCharacter]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    valueRef.current = '';
    mistakesRef.current = 0;
    completedRef.current = false;
    sampleAtRef.current = 0;
    samplesRef.current = [];
    historicalErrorsRef.current = {};
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
  const targetChars = useMemo(() => [...target], [target]);
  const valueChars = useMemo(() => [...value], [value]);

  return {
    value,
    elapsedMs,
    running,
    done,
    mistakes,
    stats,
    errors: historicalErrors,
    currentChar: targetChars[valueChars.length] ?? '',
    progress: targetChars.length ? Math.min(100, (valueChars.length / targetChars.length) * 100) : 0,
    reset,
    handleKeyDown,
    handleInputValue,
    handleVirtualKey,
  };
}
