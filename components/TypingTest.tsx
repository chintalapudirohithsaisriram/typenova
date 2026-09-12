'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTypingSession } from '@/lib/typing-session';
import { TEST_PASSAGES } from '@/lib/typing-content';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import type { TypingStats } from '@/lib/typing';

type ContentMode = 'passage' | 'words' | 'numbers' | 'punctuation' | 'custom';
type Props = { onComplete?: (stats: TypingStats, target: string, typed: string) => void; initialDuration?: number; initialMode?: ContentMode; initialCustomText?: string; compact?: boolean };

const DURATIONS = [15, 30, 60, 120, 300];
const MODES: Array<{ id: ContentMode; label: string; detail: string }> = [
  { id: 'passage', label: 'Passage', detail: 'Natural text' },
  { id: 'words', label: 'Words', detail: 'Common words' },
  { id: 'numbers', label: 'Numbers', detail: 'Digits + spaces' },
  { id: 'punctuation', label: 'Punctuation', detail: 'Real sentences' },
  { id: 'custom', label: 'Custom', detail: 'Your own text' },
];
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

function durationLabel(value: number) {
  return value < 60 ? `${value}s` : `${value / 60}m`;
}

export default function TypingTest({ onComplete, initialDuration = 60, initialMode = 'passage', initialCustomText = '', compact = false }: Props) {
  const [duration, setDuration] = useState(initialDuration);
  const [mode, setMode] = useState<ContentMode>(initialMode);
  const [customText, setCustomText] = useState(initialCustomText);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showFingerGuide, setShowFingerGuide] = useState(true);
  const [bestWpm, setBestWpm] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const target = useMemo(() => buildText(mode, customText), [mode, customText]);
  const session = useTypingSession({
    target,
    durationMs: duration * 1000,
    completeOnTarget: true,
    onComplete: (stats, text, typed) => {
      try {
        const previous = Number(localStorage.getItem('typenova-best-wpm') ?? 0);
        const next = Math.max(previous, stats.netWpm);
        localStorage.setItem('typenova-best-wpm', String(Math.round(next)));
        setBestWpm(next);
      } catch {}
      onComplete?.(stats, text, typed);
    },
  });

  useEffect(() => {
    session.reset();
    requestAnimationFrame(() => inputRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  useEffect(() => {
    try { setBestWpm(Number(localStorage.getItem('typenova-best-wpm') ?? 0)); } catch {}
  }, []);

  const topErrors = Object.entries(session.errors).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const minutes = Math.floor(session.elapsedMs / 60_000);
  const seconds = Math.floor((session.elapsedMs % 60_000) / 1000);
  const focusInput = () => requestAnimationFrame(() => inputRef.current?.focus());
  const changeDuration = (value: number) => { setDuration(value); focusInput(); };
  const changeMode = (value: ContentMode) => { setMode(value); focusInput(); };
  const restart = () => { session.reset(); focusInput(); };

  return <section className={`test-card ${compact ? 'compact' : ''}`} aria-labelledby="typing-test-title">
    {!compact && <div className="test-top">
      <div><span className="eyebrow">Step 1 · choose your test</span><h2 id="typing-test-title">Set up your test in seconds.</h2><p className="muted">Pick a time and text style. When you are ready, click the typing area and start.</p></div>
      <div className="test-status"><span className="status-dot" /> {session.running ? 'Test running' : session.done ? 'Test complete' : 'Ready'}</div>
    </div>}

    {!session.running && !session.done && <div className="test-setup" aria-label="Typing test setup">
      <div className="setup-section"><div className="setup-label"><strong>Duration</strong><span>How long do you want to type?</span></div><div className="duration-row">{DURATIONS.map((value) => <button key={value} className={duration === value ? 'chip active' : 'chip'} onClick={() => changeDuration(value)}>{durationLabel(value)}</button>)}</div></div>
      <div className="setup-section"><div className="setup-label"><strong>Text</strong><span>Choose what you want to practice.</span></div><div className="mode-grid">{MODES.map((item) => <button key={item.id} className={mode === item.id ? 'mode-option active' : 'mode-option'} onClick={() => changeMode(item.id)}><strong>{item.label}</strong><span>{item.detail}</span></button>)}</div></div>
      {mode === 'custom' && <label className="custom-text-field"><span>Custom text</span><textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Paste or type a passage here, then start the test." rows={4} /></label>}
      <div className="test-how"><strong>How it works</strong><span>1. Choose a test · 2. Type naturally · 3. Review WPM, accuracy, consistency and mistakes.</span></div>
    </div>}

    {session.done ? <div className="result-panel">
      <div className="result-heading"><span className="eyebrow">Step 3 · your result</span><h3>{Math.round(session.stats.netWpm)} WPM · {Math.round(session.stats.accuracy)}% accuracy</h3><p className="muted">{minutes}:{String(seconds).padStart(2, '0')} elapsed · {session.stats.typed} characters typed.</p></div>
      <div className="result-grid"><div className="result-primary"><strong>{Math.round(session.stats.netWpm)}</strong><span>Net WPM</span></div><div><strong>{Math.round(session.stats.grossWpm)}</strong><span>Raw WPM</span></div><div><strong>{Math.round(session.stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{Math.round(session.stats.consistency)}%</strong><span>Consistency</span></div><div><strong>{session.stats.errors}</strong><span>Key errors</span></div><div><strong>{session.stats.correct}</strong><span>Correct chars</span></div></div>
      <div className="result-insight"><strong>{topErrors.length ? 'Practice next' : 'Next step'}</strong><span>{topErrors.length ? `Focus on ${topErrors.map(([key]) => key === ' ' ? 'Space' : key.toUpperCase()).join(' · ')} before your next speed attempt.` : 'Your error control is clean. Try the next duration or a faster word mode.'}</span></div>
      <div className="result-actions"><button className="primary" onClick={restart}>Try again</button><span>{Math.round(session.stats.netWpm) >= Math.round(bestWpm) ? `Personal best · ${Math.round(session.stats.netWpm)} WPM` : `Personal best · ${Math.round(bestWpm)} WPM`}</span></div>
    </div> : <>
      <div className="metrics"><div><strong>{Math.round(session.stats.netWpm)}</strong><span>WPM</span></div><div><strong>{Math.round(session.stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{session.mistakes}</strong><span>Mistakes</span></div><div><strong>{Math.max(0, duration - Math.floor(session.elapsedMs / 1000))}s</strong><span>Remaining</span></div><div><strong>{Math.round(session.stats.consistency)}%</strong><span>Consistency</span></div></div>
      <div className="progress-track" aria-label={`${Math.round(session.progress)} percent complete`}><span style={{ width: `${session.progress}%` }} /></div>
      <div className="prompt" aria-label="Typing text">{[...target].map((char, index) => <span key={`${index}-${char}`} className={index < session.value.length ? (session.value[index] === char ? 'correct' : 'incorrect') : index === session.value.length ? 'current' : ''}>{char}</span>)}</div>
      <input ref={inputRef} className="typing-input" value={session.value} onChange={(event) => session.handleInputValue(event.target.value)} onKeyDown={session.handleKeyDown} onPaste={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onDragOver={(event) => event.preventDefault()} aria-label="Type the text above" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} inputMode="text" />
      {showKeyboard && <VirtualKeyboard targetKey={session.currentChar} showFingerGuide={showFingerGuide} />}
      <div className="test-actions"><button className="primary" onClick={session.running ? restart : focusInput}>{session.running ? 'Restart test' : 'Start typing'}</button><span>{session.running ? `Next: ${session.currentChar === ' ' ? 'Space' : session.currentChar || 'done'}` : 'Your timer starts on the first character.'}</span><div className="guide-controls"><button className={showKeyboard ? 'chip active' : 'chip'} onClick={() => setShowKeyboard((value) => !value)}>Keyboard</button><button className={showFingerGuide ? 'chip active' : 'chip'} onClick={() => setShowFingerGuide((value) => !value)}>Finger guide</button></div></div>
    </>}
  </section>;
}
