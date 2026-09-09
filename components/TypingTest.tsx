'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateStats, compareTypedText, getErrorMap, type TypingStats } from '@/lib/typing';
import { TEST_PASSAGES } from '@/lib/typing-content';
import VirtualKeyboard from '@/components/VirtualKeyboard';

type ContentMode = 'passage' | 'words' | 'numbers' | 'punctuation' | 'custom';

type Props = {
  onComplete?: (stats: TypingStats, target: string, typed: string) => void;
  initialDuration?: number;
  initialMode?: ContentMode;
  initialCustomText?: string;
  compact?: boolean;
};

const DURATIONS = [15, 30, 60, 120, 300];
const WORDS = 'the of and to in a is that for it as was with be by on not he i this are or his from at which but have an had they you one we all can her has there been if more when will would who so no time about out up into them then she many some these would like what make people know just your good other our day could write type practice'.split(' ');
const NUMBER_TEXT = '2026 314159 8080 42 100 365 12345 98765 2048 4096';
const PUNCTUATION_TEXT = 'Ready, set, type. Keep pace; stay precise! Can you keep accuracy at 98%? Yes: breathe, focus, repeat.';

function buildText(mode: ContentMode, custom: string) {
  if (mode === 'words') return Array.from({ length: 180 }, (_, i) => WORDS[i % WORDS.length]).join(' ');
  if (mode === 'numbers') return Array.from({ length: 14 }, () => NUMBER_TEXT).join(' ');
  if (mode === 'punctuation') return Array.from({ length: 9 }, () => PUNCTUATION_TEXT).join(' ');
  if (mode === 'custom') return custom.trim() || TEST_PASSAGES[0];
  return Array.from({ length: 10 }, (_, i) => TEST_PASSAGES[i % TEST_PASSAGES.length]).join(' ');
}

export default function TypingTest({ onComplete, initialDuration = 60, initialMode = 'passage', initialCustomText = '', compact = false }: Props) {
  const [duration, setDuration] = useState(initialDuration);
  const [mode, setMode] = useState<ContentMode>(initialMode);
  const [customText, setCustomText] = useState(initialCustomText);
  const [value, setValue] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showFingerGuide, setShowFingerGuide] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const lastSampleRef = useRef(0);
  const mistakesRef = useRef(0);
  const valueRef = useRef('');
  const target = useMemo(() => buildText(mode, customText), [mode, customText]);
  const comparison = useMemo(() => compareTypedText(target, value), [target, value]);
  const stats = useMemo(() => calculateStats(comparison.correct, comparison.incorrect, elapsed, samples, mistakes), [comparison, elapsed, samples, mistakes]);
  const errors = useMemo(() => getErrorMap(target, value), [target, value]);

  useEffect(() => {
    try { setBestWpm(Number(localStorage.getItem('typenova-best-wpm') ?? 0)); } catch {}
  }, []);

  const finish = useCallback((finalElapsed: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const typed = valueRef.current;
    const finalComparison = compareTypedText(target, typed);
    const finalStats = calculateStats(finalComparison.correct, finalComparison.incorrect, finalElapsed, samples, mistakesRef.current);
    setElapsed(finalElapsed);
    setRunning(false);
    setDone(true);
    const record = Math.max(0, finalStats.netWpm);
    setBestWpm((current) => {
      const next = Math.max(current, record);
      try { localStorage.setItem('typenova-best-wpm', String(Math.round(next))); } catch {}
      return next;
    });
    onComplete?.(finalStats, target, typed);
  }, [onComplete, samples, target]);

  useEffect(() => {
    if (!running || startedAtRef.current === null) return;
    const tick = () => {
      const startedAt = startedAtRef.current ?? Date.now();
      const nextElapsed = Math.min(Date.now() - startedAt, duration * 1000);
      setElapsed(nextElapsed);
      if (nextElapsed - lastSampleRef.current >= 500) {
        lastSampleRef.current = nextElapsed;
        const current = compareTypedText(target, valueRef.current);
        setSamples((items) => [...items, calculateStats(current.correct, current.incorrect, Math.max(1, nextElapsed)).grossWpm]);
      }
      if (nextElapsed >= duration * 1000) finish(nextElapsed);
    };
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [duration, finish, running, target]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    completedRef.current = false;
    lastSampleRef.current = 0;
    mistakesRef.current = 0;
    valueRef.current = '';
    setValue('');
    setElapsed(0);
    setMistakes(0);
    setSamples([]);
    setDone(false);
    setRunning(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const startOnFirstKey = useCallback(() => {
    const now = Date.now();
    startedAtRef.current = now;
    completedRef.current = false;
    lastSampleRef.current = 0;
    setRunning(true);
    setElapsed(0);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (done) return;

    if (event.ctrlKey || event.metaKey || event.altKey) {
      if (event.key.toLowerCase() === 'v' || event.key.toLowerCase() === 'c' || event.key.toLowerCase() === 'x' || event.key.toLowerCase() === 'a') {
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Tab' || event.key === 'Enter' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (valueRef.current.length) {
        valueRef.current = valueRef.current.slice(0, -1);
        setValue(valueRef.current);
      }
      return;
    }

    if (event.key.length !== 1) return;
    event.preventDefault();
    if (!running && !startedAtRef.current) startOnFirstKey();

    const expected = target[valueRef.current.length];
    if (event.key !== expected) {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
    }

    valueRef.current += event.key;
    setValue(valueRef.current);

    if (valueRef.current.length >= target.length) {
      const started = startedAtRef.current ?? Date.now();
      finish(Math.min(Date.now() - started, duration * 1000));
    }
  };

  const preventClipboard = (event: React.ClipboardEvent<HTMLInputElement>) => event.preventDefault();
  const preventDrop = (event: React.DragEvent<HTMLInputElement>) => event.preventDefault();

  const progress = Math.min(100, target.length ? (value.length / target.length) * 100 : 0);
  const currentChar = target[value.length] ?? '';
  const topErrors = Object.entries(errors).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <section className={`test-card ${compact ? 'compact' : ''}`} aria-labelledby="typing-test-title">
      <div className="test-top">
        <div>
          <span className="eyebrow">Typing lab</span>
          <h2 id="typing-test-title">Find your flow.</h2>
          <p className="muted">Physical-keyboard input only. Honest metrics, live feedback, and a clear next step.</p>
        </div>
        <div className="test-toolbar">
          <div className="duration-row" aria-label="Test duration">
            {DURATIONS.map((d) => <button key={d} className={duration === d ? 'chip active' : 'chip'} onClick={() => { setDuration(d); reset(); }}>{d < 60 ? `${d}s` : `${d / 60}m`}</button>)}
          </div>
          <button className="icon-button" aria-label="Open test settings" onClick={() => setShowSettings((open) => !open)}>{showSettings ? '×' : '•••'}</button>
        </div>
      </div>

      {showSettings && <div className="test-settings" aria-label="Typing test settings">
        <label>Content<select value={mode} onChange={(event) => { setMode(event.target.value as ContentMode); reset(); }}><option value="passage">Passages</option><option value="words">Common words</option><option value="numbers">Numbers</option><option value="punctuation">Punctuation</option><option value="custom">Custom text</option></select></label>
        {mode === 'custom' && <label className="wide">Custom text<textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Enter a passage you want to practice…" /></label>}
        <div className="guide-controls"><button className={showKeyboard ? 'chip active' : 'chip'} onClick={() => setShowKeyboard((current) => !current)}>Keyboard {showKeyboard ? 'on' : 'off'}</button><button className={showFingerGuide ? 'chip active' : 'chip'} onClick={() => setShowFingerGuide((current) => !current)}>Finger guide {showFingerGuide ? 'on' : 'off'}</button></div>
      </div>}

      {done ? <div className="result-panel">
        <div className="result-heading"><span className="eyebrow">Test complete</span><h3>{Math.round(stats.netWpm)} WPM. Now turn the result into progress.</h3></div>
        <div className="result-grid"><div className="result-primary"><strong>{Math.round(stats.netWpm)}</strong><span>Net WPM</span></div><div><strong>{Math.round(stats.grossWpm)}</strong><span>Raw WPM</span></div><div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{Math.round(stats.consistency)}%</strong><span>Consistency</span></div><div><strong>{stats.errors}</strong><span>Key errors</span></div><div><strong>{stats.correct}</strong><span>Correct chars</span></div></div>
        <div className="result-insight"><strong>TypeNova Coach</strong><span>{topErrors.length ? `Most common target errors: ${topErrors.map(([key, count]) => `${key.toUpperCase()} ×${count}`).join(', ')}.` : 'Clean run. Your next opportunity is controlled speed.'}</span></div>
        <div className="result-actions"><button className="primary" onClick={reset}>Retake test</button><span>{Math.round(stats.netWpm) > Math.round(bestWpm) ? 'Personal best unlocked.' : `Personal best: ${Math.round(bestWpm)} WPM`}</span></div>
      </div> : <>
        <div className="metrics"><div><strong>{Math.round(stats.netWpm)}</strong><span>WPM</span></div><div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{mistakes}</strong><span>Errors</span></div><div><strong>{Math.max(0, duration - Math.floor(elapsed / 1000))}s</strong><span>Remaining</span></div><div><strong>{Math.round(stats.consistency)}%</strong><span>Consistency</span></div></div>
        <div className="progress-track" aria-label={`${Math.round(progress)} percent complete`}><span style={{ width: `${progress}%` }} /></div>
        <div className="prompt" aria-label="Typing text">{[...target].map((char, index) => <span key={`${index}-${char}`} className={index < value.length ? (value[index] === char ? 'correct' : 'incorrect') : index === value.length ? 'current' : ''}>{char}</span>)}</div>
        <input ref={inputRef} className="typing-input" value={value} onChange={() => {}} onKeyDown={onKeyDown} onPaste={preventClipboard} onCopy={preventClipboard} onCut={preventClipboard} onDrop={preventDrop} onDragOver={preventDrop} aria-label="Type the text above using your physical keyboard" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} inputMode="text" />
        {showKeyboard && <VirtualKeyboard targetKey={currentChar} showFingerGuide={showFingerGuide} />}
        <div className="test-actions"><button className="primary" onClick={reset}>{running ? 'Restart' : 'Start typing'}</button><span>{running ? `Next key: ${currentChar === ' ' ? 'Space' : currentChar || 'done'}` : 'Your timer starts on the first physical character.'}</span></div>
      </>}
    </section>
  );
}
