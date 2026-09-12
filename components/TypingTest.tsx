'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTypingSession } from '@/lib/typing-session';
import { TEST_PASSAGES } from '@/lib/typing-content';
import { personalBests } from '@/lib/profile';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import type { TypingStats } from '@/lib/typing';

type ContentMode = 'passage' | 'words' | 'numbers' | 'punctuation' | 'custom';
type Props = { onComplete?: (stats: TypingStats, target: string, typed: string) => void; initialDuration?: number; initialMode?: ContentMode; initialCustomText?: string; compact?: boolean };

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
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showFingerGuide, setShowFingerGuide] = useState(true);
  const [bestWpm, setBestWpm] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const target = useMemo(() => buildText(mode, customText), [mode, customText]);
  const session = useTypingSession({ target, durationMs: duration * 1000, completeOnTarget: true, onComplete: (stats, text, typed) => {
    try { const previous = Number(localStorage.getItem('typenova-best-wpm') ?? 0); const next = Math.max(previous, stats.netWpm); localStorage.setItem('typenova-best-wpm', String(Math.round(next))); setBestWpm(next); } catch {}
    onComplete?.(stats, text, typed);
  }});

  useEffect(() => {
    session.reset();
    requestAnimationFrame(() => inputRef.current?.focus());
    // Reset intentionally follows a content/duration change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);
  useEffect(() => { try { setBestWpm(Number(localStorage.getItem('typenova-best-wpm') ?? 0)); } catch {} }, []);

  const topErrors = Object.entries(session.errors).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const minutes = Math.floor(session.elapsedMs / 60_000);
  const seconds = Math.floor((session.elapsedMs % 60_000) / 1000);

  return <section className={`test-card ${compact ? 'compact' : ''}`} aria-labelledby="typing-test-title">
    <div className="test-top">
      <div><span className="eyebrow">Typing lab</span><h2 id="typing-test-title">Measure. Learn. Improve.</h2><p className="muted">A dedicated typing engine with honest metrics and no paste shortcuts.</p></div>
      <div className="test-toolbar"><div className="duration-row" aria-label="Test duration">{DURATIONS.map((value) => <button key={value} className={duration === value ? 'chip active' : 'chip'} onClick={() => setDuration(value)}>{value < 60 ? `${value}s` : `${value / 60}m`}</button>)}</div><button className="icon-button" aria-label="Open test settings" onClick={() => setShowSettings((value) => !value)}>{showSettings ? '×' : '•••'}</button></div>
    </div>
    {showSettings && <div className="test-settings" aria-label="Typing test settings">
      <label>Content<select value={mode} onChange={(event) => setMode(event.target.value as ContentMode)}><option value="passage">Passages</option><option value="words">Common words</option><option value="numbers">Numbers</option><option value="punctuation">Punctuation</option><option value="custom">Custom text</option></select></label>
      {mode === 'custom' && <label className="wide">Custom text<textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Enter a passage to practice…" /></label>}
      <div className="guide-controls"><button className={showKeyboard ? 'chip active' : 'chip'} onClick={() => setShowKeyboard((value) => !value)}>Keyboard {showKeyboard ? 'on' : 'off'}</button><button className={showFingerGuide ? 'chip active' : 'chip'} onClick={() => setShowFingerGuide((value) => !value)}>Finger guide {showFingerGuide ? 'on' : 'off'}</button></div>
    </div>}
    {session.done ? <div className="result-panel">
      <div className="result-heading"><span className="eyebrow">Test complete</span><h3>{Math.round(session.stats.netWpm)} WPM · {Math.round(session.stats.accuracy)}% accuracy</h3><p className="muted">{minutes}:{String(seconds).padStart(2, '0')} elapsed · {session.stats.correct + session.stats.incorrect} characters typed.</p></div>
      <div className="result-grid"><div className="result-primary"><strong>{Math.round(session.stats.netWpm)}</strong><span>Net WPM</span></div><div><strong>{Math.round(session.stats.grossWpm)}</strong><span>Raw WPM</span></div><div><strong>{Math.round(session.stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{Math.round(session.stats.consistency)}%</strong><span>Consistency</span></div><div><strong>{session.stats.errors}</strong><span>Key errors</span></div><div><strong>{session.stats.correct}</strong><span>Correct chars</span></div></div>
      <div className="result-insight"><strong>Next best step</strong><span>{topErrors.length ? `Practice ${topErrors.map(([key]) => key.toUpperCase()).join(' + ')} for a few minutes before retesting.` : 'Your accuracy is clean. Add a short speed burst and protect the same control.'}</span></div>
      <div className="result-actions"><button className="primary" onClick={session.reset}>Try again</button><span>{Math.round(session.stats.netWpm) >= Math.round(bestWpm) ? `Personal best · ${Math.round(session.stats.netWpm)} WPM` : `Personal best · ${Math.round(bestWpm)} WPM`}</span></div>
    </div> : <>
      <div className="metrics"><div><strong>{Math.round(session.stats.netWpm)}</strong><span>WPM</span></div><div><strong>{Math.round(session.stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{session.mistakes}</strong><span>Errors</span></div><div><strong>{Math.max(0, duration - Math.floor(session.elapsedMs / 1000))}s</strong><span>Remaining</span></div><div><strong>{Math.round(session.stats.consistency)}%</strong><span>Consistency</span></div></div>
      <div className="progress-track" aria-label={`${Math.round(session.progress)} percent complete`}><span style={{ width: `${session.progress}%` }} /></div>
      <div className="prompt" aria-label="Typing text">{[...target].map((char, index) => <span key={`${index}-${char}`} className={index < session.value.length ? (session.value[index] === char ? 'correct' : 'incorrect') : index === session.value.length ? 'current' : ''}>{char}</span>)}</div>
      <input ref={inputRef} className="typing-input" value={session.value} onChange={() => {}} onKeyDown={session.handleKeyDown} onPaste={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onDragOver={(event) => event.preventDefault()} aria-label="Type the text above using your physical keyboard" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} inputMode="text" />
      {showKeyboard && <VirtualKeyboard targetKey={session.currentChar} showFingerGuide={showFingerGuide} />}
      <div className="test-actions"><button className="primary" onClick={session.reset}>{session.running ? 'Restart' : 'Start typing'}</button><span>{session.running ? `Next key: ${session.currentChar === ' ' ? 'Space' : session.currentChar || 'done'}` : 'Timer starts with your first physical character.'}</span></div>
    </>}
  </section>;
}
