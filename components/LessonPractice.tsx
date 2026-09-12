'use client';

import { useEffect, useRef } from 'react';
import { useTypingSession } from '@/lib/typing-session';
import { FINGER_BY_KEY } from '@/lib/typing-content';
import type { Lesson } from '@/lib/typing-content';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import type { TypingStats } from '@/lib/typing';

type Props = { lesson: Lesson; showKeyboard: boolean; showFingerGuide: boolean; onComplete: (stats: TypingStats, target: string, typed: string) => void; onRetry: () => void };

export default function LessonPractice({ lesson, showKeyboard, showFingerGuide, onComplete, onRetry }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const session = useTypingSession({ target: lesson.exercise, completeOnTarget: true, onComplete });
  useEffect(() => { session.reset(); requestAnimationFrame(() => inputRef.current?.focus()); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);
  const accuracy = Math.round(session.stats.accuracy);
  const wpm = Math.round(session.stats.netWpm);
  const passed = session.done && session.value.length >= lesson.exercise.length && accuracy >= lesson.goalAccuracy && wpm >= lesson.goalWpm;
  const finger = FINGER_BY_KEY[session.currentChar.toLowerCase()] ?? lesson.finger;
  const retry = () => { session.reset(); requestAnimationFrame(() => inputRef.current?.focus()); onRetry(); };
  const focus = () => requestAnimationFrame(() => inputRef.current?.focus());
  return <div className="lesson-practice-card">
    <div className="lesson-metrics"><div><strong>{wpm}</strong><span>Net WPM</span></div><div><strong>{session.value.length ? `${accuracy}%` : '—'}</strong><span>Accuracy</span></div><div><strong>{session.mistakes || '—'}</strong><span>Keystroke errors</span></div><div><strong>{session.value.length ? `${Math.round(session.stats.realAccuracy)}%` : '—'}</strong><span>Real accuracy</span></div><div><strong>{Math.round(session.progress)}%</strong><span>Progress</span></div><div><strong>{session.value.length ? `${Math.floor(session.elapsedMs / 60_000)}:${String(Math.floor((session.elapsedMs % 60_000) / 1000)).padStart(2, '0')}` : '—'}</strong><span>Active time</span></div></div>
    <div className="lesson-goal-line"><span>No time limit · type at your own pace</span><span>Mastery: {lesson.goalAccuracy}%+ accuracy · {lesson.goalWpm}+ WPM</span></div>
    <div className="progress-track"><span style={{ width: `${session.progress}%` }} /></div>
    {!session.done ? <>
      <div className="lesson-start-note"><strong>Ready?</strong><span>Type the highlighted exercise at your own pace. The clock starts on your first key and measures the session precisely.</span><button className="secondary" onClick={focus}>Focus typing area</button></div>
      <div className="prompt lesson-prompt" aria-label="Lesson typing text">{[...lesson.exercise].map((char, index) => <span key={`${index}-${char}`} className={index < session.value.length ? (session.value[index] === char ? 'correct' : 'incorrect') : index === session.value.length ? 'current' : ''}>{char}</span>)}</div>
      <input ref={inputRef} className="typing-input lesson-input" value={session.value} onChange={(event) => session.handleInputValue(event.target.value)} onKeyDown={session.handleKeyDown} onPaste={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onDragOver={(event) => event.preventDefault()} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} inputMode="text" aria-label={`Practice ${lesson.title}`} />
      <div className="lesson-live-guide"><span>Next key <strong>{session.currentChar === ' ' ? 'Space' : session.currentChar || '—'}</strong></span><span>Finger <strong>{finger}</strong></span><span>{session.running ? `${Math.floor(session.elapsedMs / 60_000)}:${String(Math.floor((session.elapsedMs % 60_000) / 1000)).padStart(2, '0')} active` : 'Ready'}</span></div>
      {showKeyboard && <VirtualKeyboard targetKey={session.currentChar || lesson.targetKeys[0]} showFingerGuide={showFingerGuide} />}
    </> : <div className={`lesson-result ${passed ? 'passed' : 'retry'}`}>
      <span className="eyebrow">{passed ? 'Lesson mastered' : 'Keep practicing'}</span>
      <h3>{passed ? 'You cleared both mastery gates.' : 'You finished the exercise, but the gate is not cleared yet.'}</h3>
      <p>{passed ? `${accuracy}% accuracy at ${wpm} WPM meets the ${lesson.goalAccuracy}% accuracy and ${lesson.goalWpm} WPM targets.` : `You reached ${accuracy}% accuracy at ${wpm} WPM. Target: ${lesson.goalAccuracy}% accuracy and ${lesson.goalWpm} WPM.`}</p>
      <button className={passed ? 'primary' : 'secondary'} onClick={retry}>{passed ? 'Practice again' : 'Retry lesson'}</button>
    </div>}
  </div>;
}
