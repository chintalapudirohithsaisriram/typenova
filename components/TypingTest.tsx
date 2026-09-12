'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTypingSession } from '@/lib/typing-session';
import { TEST_PASSAGES } from '@/lib/typing-content';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import type { TypingStats } from '@/lib/typing';

type ContentMode = 'passage' | 'words' | 'numbers' | 'punctuation' | 'custom';
type Props = { onComplete?: (stats: TypingStats, target: string, typed: string) => void; initialDuration?: number; initialMode?: ContentMode; initialCustomText?: string; compact?: boolean };

const MODES: Array<{ id: ContentMode; label: string; detail: string }> = [
  { id: 'passage', label: 'Passage', detail: 'Natural text' },
  { id: 'words', label: 'Words', detail: 'Common words' },
  { id: 'numbers', label: 'Numbers', detail: 'Digits + spaces' },
  { id: 'punctuation', label: 'Punctuation', detail: 'Real sentences' },
  { id: 'custom', label: 'Custom', detail: 'Your own text' },
];
const WORDS = 'the of and to in a is that for it as was with be by on not he i this are or his from at which but have an had they you one we all can her has there been if more when will would who so no time about out up into them then she many some these like what make people know just your good other our day could write type practice'.split(' ');
const NUMBER_TEXT = '2026 314159 8080 42 100 365 12345 98765 2048 4096';
const PUNCTUATION_TEXT = 'Ready, set, type. Keep pace; stay precise! Can you keep accuracy at 98%? Yes: breathe, focus, repeat.';

function buildText(mode: ContentMode, custom: string) {
  if (mode === 'words') return Array.from({ length: 66 }, (_, i) => WORDS[i % WORDS.length]).join(' ');
  if (mode === 'numbers') return Array.from({ length: 6 }, () => NUMBER_TEXT).join(' ');
  if (mode === 'punctuation') return Array.from({ length: 4 }, () => PUNCTUATION_TEXT).join(' ');
  if (mode === 'custom') return custom.trim();
  return Array.from({ length: 4 }, (_, i) => TEST_PASSAGES[i % TEST_PASSAGES.length]).join(' ');
}

export default function TypingTest({ onComplete, initialMode = 'passage', initialCustomText = '', compact = false }: Props) {
  const [mode, setMode] = useState<ContentMode>(initialMode);
  const [customDraft, setCustomDraft] = useState(initialCustomText);
  const [customText, setCustomText] = useState(initialCustomText);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showFingerGuide, setShowFingerGuide] = useState(true);
  const [bestWpm, setBestWpm] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const target = useMemo(() => buildText(mode, customText), [mode, customText]);
  const session = useTypingSession({ target, completeOnTarget: true, onComplete: (stats, text, typed) => { try { const previous = Number(localStorage.getItem('typenova-best-wpm') ?? 0); const next = Math.max(previous, stats.netWpm); localStorage.setItem('typenova-best-wpm', String(Math.round(next))); setBestWpm(next); } catch {} onComplete?.(stats, text, typed); } });

  useEffect(() => { session.reset(); requestAnimationFrame(() => inputRef.current?.focus()); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  useEffect(() => { try { setBestWpm(Number(localStorage.getItem('typenova-best-wpm') ?? 0)); } catch {} }, []);

  const topErrors = Object.entries(session.errors).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const minutes = Math.floor(session.elapsedMs / 60_000);
  const seconds = Math.floor((session.elapsedMs % 60_000) / 1000);
  const focusInput = () => requestAnimationFrame(() => inputRef.current?.focus());
  const changeMode = (value: ContentMode) => { setMode(value); focusInput(); };
  const applyCustom = () => { const cleaned = customDraft.trim(); if (!cleaned) return; setCustomText(cleaned); setMode('custom'); focusInput(); };
  const restart = () => { session.reset(); focusInput(); };

  return <section className={`test-card ${compact ? 'compact' : ''}`} aria-labelledby="typing-test-title">
    {!compact && <div className="test-top"><div><span className="eyebrow">Typing test</span><h2 id="typing-test-title">Type at your own pace.</h2><p className="muted">No time limit. Finish the text whenever you are ready. TypeNova measures exact keystrokes and elapsed time, then calculates your performance.</p></div><div className="test-status"><span className="status-dot" /> {session.running ? 'Typing' : session.done ? 'Complete' : 'Ready'}</div></div>}
    {!session.running && !session.done && <div className="test-setup" aria-label="Typing test setup"><div className="setup-section"><div className="setup-label"><strong>Text</strong><span>Choose what you want to measure.</span></div><div className="mode-grid">{MODES.map((item) => <button type="button" key={item.id} className={mode === item.id ? 'mode-option active' : 'mode-option'} onClick={() => changeMode(item.id)}><strong>{item.label}</strong><span>{item.detail}</span></button>)}</div></div>{mode === 'custom' && <div className="custom-editor"><label className="custom-text-field"><span>Edit your custom text</span><textarea value={customDraft} onChange={(event) => setCustomDraft(event.target.value)} placeholder="Paste or type any text you want to practice." rows={6} /></label><div className="custom-editor-actions"><span>{customDraft.trim().length} characters</span><button type="button" className="primary" disabled={!customDraft.trim()} onClick={applyCustom}>Use this text</button></div></div>}<div className="test-how"><strong>Calculation-first measurement</strong><span>Every 5 typed characters equals one word. Raw WPM measures typing volume. Net WPM adds a transparent error penalty. Accuracy, real accuracy, consistency and keystroke errors remain separate signals.</span></div></div>}
    {session.done ? <div className="result-panel"><div className="result-heading"><span className="eyebrow">Result</span><h3>{Math.round(session.stats.netWpm)} WPM · {Math.round(session.stats.accuracy)}% accuracy</h3><p className="muted">{session.stats.typed} characters processed · {minutes}:{String(seconds).padStart(2, '0')} active typing time.</p></div><div className="result-grid"><div className="result-primary"><strong>{Math.round(session.stats.netWpm)}</strong><span>Net WPM</span></div><div><strong>{Math.round(session.stats.grossWpm)}</strong><span>Raw WPM</span></div><div><strong>{Math.round(session.stats.accuracy)}%</strong><span>Accuracy</span></div><div><strong>{Math.round(session.stats.realAccuracy)}%</strong><span>Real accuracy</span></div><div><strong>{Math.round(session.stats.consistency)}%</strong><span>Consistency</span></div><div><strong>{session.stats.errors}</strong><span>Keystroke errors</span></div><div><strong>{session.stats.correct}</strong><span>Correct chars</span></div><div><strong>{Math.round(session.stats.errorRate)}%</strong><span>Error rate</span></div></div><div className="result-insight"><strong>{topErrors.length ? 'Practice next' : 'Next step'}</strong><span>{topErrors.length ? `Focus on ${topErrors.map(([key]) => key === ' ' ? 'Space' : key.toUpperCase()).join(' · ')} before your next attempt.` : 'Your error control is clean. Repeat this text to confirm the result and build a stable benchmark.'}</span></div><div className="result-actions"><button type="button" className="primary" onClick={restart}>Try again</button><span>{Math.round(session.stats.netWpm) >= Math.round(bestWpm) ? `Personal best · ${Math.round(session.stats.netWpm)} WPM` : `Personal best · ${Math.round(bestWpm)} WPM`}</span></div></div> : <><div className="metrics"><div><strong>{Math.round(session.stats.netWpm)}</strong><span>Net WPM</span></div><div><strong>{session.value.length ? `${Math.round(session.stats.accuracy)}%` : '—'}</strong><span>Accuracy</span></div><div><strong>{session.mistakes || '—'}</strong><span>Keystroke errors</span></div><div><strong>{session.value.length ? `${Math.round(session.stats.realAccuracy)}%` : '—'}</strong><span>Real accuracy</span></div><div><strong>{session.value.length >= 2 ? `${Math.round(session.stats.consistency)}%` : '—'}</strong><span>Consistency</span></div><div><strong>{session.value.length ? `${minutes}:${String(seconds).padStart(2, '0')}` : '—'}</strong><span>Active time</span></div></div><div className="progress-track" aria-label={`${Math.round(session.progress)} percent complete`}><span style={{ width: `${session.progress}%` }} /></div>{target ? <div className="prompt" aria-label="Typing text">{[...target].map((char, index) => { const typedChar = [...session.value][index]; return <span key={`${index}-${char}`} className={index < [...session.value].length ? typedChar === char ? 'correct' : 'incorrect' : index === [...session.value].length ? 'current' : ''}>{char}</span>; })}</div> : <div className="custom-empty"><strong>Add custom text to begin.</strong><span>Write or paste your text above, then choose “Use this text”.</span></div>}<input ref={inputRef} className="typing-input" value={session.value} onChange={(event) => session.handleInputValue(event.target.value)} onKeyDown={session.handleKeyDown} onPaste={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onDragOver={(event) => event.preventDefault()} aria-label="Type the text above" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} inputMode="text" />{showKeyboard && <VirtualKeyboard targetKey={session.currentChar} showFingerGuide={showFingerGuide} onKeySelect={session.handleVirtualKey} />}<div className="test-actions"><button type="button" className="primary" onClick={session.running ? restart : focusInput}>{session.running ? 'Restart' : 'Start typing'}</button><span>{session.running ? `Next key: ${session.currentChar === ' ' ? 'Space' : session.currentChar || 'done'}` : 'Unlimited · starts on first character'}</span><div className="guide-controls"><button type="button" className={showKeyboard ? 'chip active' : 'chip'} onClick={() => setShowKeyboard((value) => !value)}>Keyboard</button><button type="button" className={showFingerGuide ? 'chip active' : 'chip'} onClick={() => setShowFingerGuide((value) => !value)}>Finger guide</button></div></div></>}
  </section>;
}
