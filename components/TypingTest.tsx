'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateStats, compareTypedText, getErrorMap, TypingStats } from '@/lib/typing';
import { TEST_PASSAGES } from '@/lib/typing-content';

type Props = {
  onComplete?: (stats: TypingStats, target: string, typed: string) => void;
  initialDuration?: number;
  compact?: boolean;
};

type ContentMode = 'passage' | 'words' | 'numbers' | 'punctuation' | 'custom';
const DURATIONS = [15, 30, 60, 120, 300];
const WORDS = 'the of and to in a is that for it as was with be by on not he i this are or his from at which but have an had they you one we all can her has there been if more when will would who so no time about out up into them then she many some these would like what make people know just your good other our day could write type practice'.split(' ');
const NUMBER_TEXT = '2026 314159 8080 42 100 365 12345 98765 2048 4096';
const PUNCTUATION_TEXT = 'Ready, set, type. Keep pace; stay precise! Can you keep accuracy at 98%? Yes: breathe, focus, repeat.';

function buildText(mode: ContentMode, custom: string) {
  if (mode === 'words') return Array.from({ length: 160 }, (_, i) => WORDS[i % WORDS.length]).join(' ');
  if (mode === 'numbers') return Array.from({ length: 12 }, () => NUMBER_TEXT).join(' ');
  if (mode === 'punctuation') return Array.from({ length: 8 }, () => PUNCTUATION_TEXT).join(' ');
  if (mode === 'custom') return custom.trim() || TEST_PASSAGES[0];
  return Array.from({ length: 8 }, (_, i) => TEST_PASSAGES[i % TEST_PASSAGES.length]).join(' ');
}

export default function TypingTest({ onComplete, initialDuration = 60, compact = false }: Props) {
  const [duration, setDuration] = useState(initialDuration);
  const [mode, setMode] = useState<ContentMode>('passage');
  const [customText, setCustomText] = useState('');
  const [value, setValue] = useState('');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);
  const lastSampleRef = useRef(0);
  const target = useMemo(() => buildText(mode, customText), [mode, customText]);
  const comparison = useMemo(() => compareTypedText(target, value), [target, value]);
  const stats = useMemo(() => calculateStats(comparison.correct, comparison.incorrect, elapsed, samples), [comparison, elapsed, samples]);
  const errors = useMemo(() => getErrorMap(target, value), [target, value]);

  useEffect(() => { try { setBestWpm(Number(localStorage.getItem('typenova-best-wpm') ?? 0)); } catch {} }, []);

  const finish = useCallback((finalElapsed: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const finalComparison = compareTypedText(target, value);
    const finalStats = calculateStats(finalComparison.correct, finalComparison.incorrect, finalElapsed, samples);
    setElapsed(finalElapsed);
    setRunning(false);
    setDone(true);
    setBestWpm((current) => {
      const next = Math.max(current, finalStats.netWpm);
      try { localStorage.setItem('typenova-best-wpm', String(Math.round(next))); } catch {}
      return next;
    });
    onComplete?.(finalStats, target, value);
  }, [onComplete, samples, target, value]);

  useEffect(() => {
    if (!running || startedAt === null) return;
    const tick = () => {
      const nextElapsed = Math.min(Date.now() - startedAt, duration * 1000);
      setElapsed(nextElapsed);
      if (nextElapsed - lastSampleRef.current >= 500) {
        lastSampleRef.current = nextElapsed;
        setSamples((current) => [...current, calculateStats(compareTypedText(target, value).correct, compareTypedText(target, value).incorrect, Math.max(1, nextElapsed)).grossWpm]);
      }
      if (nextElapsed >= duration * 1000) finish(nextElapsed);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [duration, finish, running, startedAt, target, value]);

  const start = useCallback(() => {
    setValue(''); setElapsed(0); setMistakes(0); setSamples([]); lastSampleRef.current = 0;
    setDone(false); completedRef.current = false;
    const now = Date.now(); setStartedAt(now); setRunning(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (done) return;
    if (event.key === 'Backspace') return;
    if (event.key.length !== 1) return;
    if (target[value.length] !== event.key) setMistakes((count) => count + 1);
  };

  const onChange = (next: string) => {
    if (done) return;
    if (!running) {
      const now = Date.now(); setStartedAt(now); setRunning(true); completedRef.current = false;
    }
    const nextValue = next.slice(0, target.length);
    setValue(nextValue);
    if (nextValue.length >= target.length) {
      const finalElapsed = startedAt ? Math.min(Date.now() - startedAt, duration * 1000) : 0;
      finish(finalElapsed);
    }
  };

  const progress = Math.min(100, (value.length / target.length) * 100);
  const currentChar = target[value.length] ?? '';
  const topErrors = Object.entries(errors).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <section className={`test-card ${compact ? 'compact' : ''}`} aria-labelledby="typing-test-title">
      <div className="test-top">
        <div>
          <span className="eyebrow">Typing lab</span>
          <h2 id="typing-test-title">Find your flow.</h2>
          <p className="muted">Real-time feedback, honest metrics, and a clear next step.</p>
        </div>
        <div className="test-toolbar">
          <div className="duration-row" aria-label="Test duration">
            {DURATIONS.map((d) => <button key={d} className={duration === d ? 'chip active' : 'chip'} onClick={() => { setDuration(d); start(); }}>{d < 60 ? `${d}s` : `${d / 60}m`}</button>)}
          </div>
          <button className="icon-button" aria-label="Open test settings" onClick={() => setShowSettings((open) => !open)}>{showSettings ? '×' : '•••'}</button>
        </div>
      </div>

      {showSettings && (
        <div className="test-settings" aria-label="Typing test settings">
          <label>Content
            <select value={mode} onChange={(event) => { setMode(event.target.value as ContentMode); setDone(false); setValue(''); }}>
              <option value="passage">Passages</option><option value="words">Common words</option><option value="numbers">Numbers</option><option value="punctuation">Punctuation</option><option value="custom">Custom text</option>
            </select>
          </label>
          {mode === 'custom' && <label className="wide">Custom text<textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Paste a passage you want to practice…" /></label>}
        </div>
      )}

      {done ? (
        <div className="result-panel">
          <div className="result-heading"><span className="eyebrow">Test complete</span><h3>{Math.round(stats.netWpm)} WPM. Now turn the result into progress.</h3></div>
          <div className="result-grid">
            <div className="result-primary"><strong>{Math.round(stats.netWpm)}</strong><span>Net WPM</span></div>
            <div><strong>{Math.round(stats.grossWpm)}</strong><span>Raw WPM</span></div>
            <div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div>
            <div><strong>{Math.round(stats.consistency)}%</strong><span>Consistency</span></div>
            <div><strong>{mistakes}</strong><span>Key errors</span></div>
          </div>
          <div className="result-insight"><strong>TypeNova Coach</strong><span>{topErrors.length ? `Most common target errors: ${topErrors.map(([key, count]) => `${key.toUpperCase()} ×${count}`).join(', ')}.` : 'Clean run. Your next opportunity is controlled speed.'}</span></div>
          <div className="result-actions"><button className="primary" onClick={start}>Retake test</button><span>{Math.round(stats.netWpm) > Math.round(bestWpm) ? 'Personal best unlocked.' : `Personal best: ${Math.round(bestWpm)} WPM`}</span></div>
        </div>
      ) : (
        <>
          <div className="metrics">
            <div><strong>{Math.round(stats.netWpm)}</strong><span>WPM</span></div>
            <div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div>
            <div><strong>{mistakes}</strong><span>Errors</span></div>
            <div><strong>{Math.max(0, duration - Math.floor(elapsed / 1000))}s</strong><span>Remaining</span></div>
            <div><strong>{Math.round(stats.consistency)}%</strong><span>Consistency</span></div>
          </div>
          <div className="progress-track" aria-label={`${Math.round(progress)} percent complete`}><span style={{ width: `${progress}%` }} /></div>
          <div className="prompt" aria-label="Typing text">
            {[...target].map((char, index) => <span key={`${index}-${char}`} className={index < value.length ? (value[index] === char ? 'correct' : 'incorrect') : index === value.length ? 'current' : ''}>{char}</span>)}
          </div>
          <input ref={inputRef} className="typing-input" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} aria-label="Type the text above" autoComplete="off" spellCheck={false} />
          <div className="test-actions"><button className="primary" onClick={start}>{running ? 'Restart' : 'Start typing'}</button><span>{running ? `Next key: ${currentChar === ' ' ? 'Space' : currentChar}` : 'Your timer starts with the first character.'}</span></div>
        </>
      )}
    </section>
  );
}
