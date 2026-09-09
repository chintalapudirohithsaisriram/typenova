'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateStats, compareTypedText, TypingStats } from '@/lib/typing';
import { TEST_PASSAGES } from '@/lib/typing-content';

const DURATIONS = [15, 30, 60, 120, 300];
const TEST_TEXT = TEST_PASSAGES.join(' ');

type Props = { onComplete?: (stats: TypingStats) => void };

export default function TypingTest({ onComplete }: Props) {
  const [duration, setDuration] = useState(30);
  const [value, setValue] = useState('');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);

  const comparison = useMemo(() => compareTypedText(TEST_TEXT, value), [value]);
  const stats = useMemo(
    () => calculateStats(comparison.correct, comparison.incorrect, elapsed),
    [comparison, elapsed],
  );

  useEffect(() => {
    try {
      setBestWpm(Number(localStorage.getItem('typenova-best-wpm') ?? 0));
    } catch {}
  }, []);

  const finish = useCallback((finalElapsed = elapsed) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false);
    setDone(true);
    setElapsed(finalElapsed);
    const finalComparison = compareTypedText(TEST_TEXT, value);
    const finalStats = calculateStats(finalComparison.correct, finalComparison.incorrect, finalElapsed);
    const nextBest = Math.max(bestWpm, finalStats.netWpm);
    setBestWpm(nextBest);
    try { localStorage.setItem('typenova-best-wpm', String(Math.round(nextBest))); } catch {}
    onComplete?.(finalStats);
  }, [bestWpm, elapsed, onComplete, value]);

  useEffect(() => {
    if (!running || startedAt === null) return;
    const tick = () => {
      const nextElapsed = Math.min(Date.now() - startedAt, duration * 1000);
      setElapsed(nextElapsed);
      if (nextElapsed >= duration * 1000) finish(nextElapsed);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [duration, finish, running, startedAt]);

  const start = useCallback(() => {
    setValue('');
    setElapsed(0);
    setMistakes(0);
    setDone(false);
    completedRef.current = false;
    const now = Date.now();
    setStartedAt(now);
    setRunning(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (done) return;
    if (event.key === 'Backspace') return;
    if (event.key.length !== 1) return;
    const expected = TEST_TEXT[value.length];
    if (expected !== event.key) setMistakes((count) => count + 1);
  };

  const onChange = (next: string) => {
    if (done) return;
    if (!running) {
      const now = Date.now();
      setStartedAt(now);
      setRunning(true);
      completedRef.current = false;
    }
    const nextValue = next.slice(0, TEST_TEXT.length);
    setValue(nextValue);
    if (nextValue.length >= TEST_TEXT.length) {
      const finalElapsed = startedAt ? Date.now() - startedAt : 0;
      finish(Math.min(finalElapsed, duration * 1000));
    }
  };

  const progress = Math.min(100, (value.length / TEST_TEXT.length) * 100);
  const currentChar = TEST_TEXT[value.length] ?? '';

  return (
    <section className="test-card" aria-labelledby="typing-test-title">
      <div className="test-top">
        <div>
          <span className="eyebrow">Typing test</span>
          <h2 id="typing-test-title">Find your flow.</h2>
          <p className="muted">A continuous passage pool with live, character-level feedback.</p>
        </div>
        <div className="duration-row" aria-label="Test duration">
          {DURATIONS.map((d) => (
            <button key={d} className={duration === d ? 'chip active' : 'chip'} onClick={() => { setDuration(d); start(); }}>
              {d < 60 ? `${d}s` : `${d / 60}m`}
            </button>
          ))}
        </div>
      </div>

      {done ? (
        <div className="result-panel">
          <div className="result-heading"><span className="eyebrow">Test complete</span><h3>Your performance, at a glance.</h3></div>
          <div className="result-grid">
            <div className="result-primary"><strong>{Math.round(stats.netWpm)}</strong><span>Net WPM</span></div>
            <div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div>
            <div><strong>{mistakes}</strong><span>Key errors</span></div>
            <div><strong>{(stats.elapsedMs / 1000).toFixed(1)}s</strong><span>Time</span></div>
          </div>
          <div className="result-actions"><button className="primary" onClick={start}>Retake test</button><span>{Math.round(stats.netWpm) > Math.round(bestWpm) ? 'New personal best.' : `Best: ${Math.round(bestWpm)} WPM`}</span></div>
        </div>
      ) : (
        <>
          <div className="metrics">
            <div><strong>{Math.round(stats.netWpm)}</strong><span>WPM</span></div>
            <div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div>
            <div><strong>{mistakes}</strong><span>Errors</span></div>
            <div><strong>{(elapsed / 1000).toFixed(1)}s</strong><span>Time</span></div>
          </div>
          <div className="progress-track" aria-label={`${Math.round(progress)} percent complete`}><span style={{ width: `${progress}%` }} /></div>
          <div className="prompt" aria-label="Typing text">
            {[...TEST_TEXT].map((char, index) => (
              <span key={`${index}-${char}`} className={index < value.length ? (value[index] === char ? 'correct' : 'incorrect') : index === value.length ? 'current' : ''}>{char}</span>
            ))}
          </div>
          <input ref={inputRef} className="typing-input" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} aria-label="Type the text above" autoComplete="off" spellCheck={false} />
          <div className="test-actions"><button className="primary" onClick={start}>{running ? 'Restart' : 'Start typing'}</button><span>{running ? `Next key: ${currentChar === ' ' ? 'Space' : currentChar}` : 'Start the timer when your first character lands.'}</span></div>
        </>
      )}
    </section>
  );
}
