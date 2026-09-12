'use client';

import { useEffect, useRef } from 'react';
import { useTypingSession } from '@/lib/typing-session';
import type { Lesson } from '@/lib/typing-content';
import { FINGER_BY_KEY } from '@/lib/typing-content';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import type { TypingStats } from '@/lib/typing';

type Props = {
  lesson: Lesson;
  showKeyboard: boolean;
  showFingerGuide: boolean;
  onComplete: (stats: TypingStats, target: string, typed: string) => void;
  onRetry: () => void;
};

export default function LessonPractice({ lesson, showKeyboard, showFingerGuide, onComplete, onRetry }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const session = useTypingSession({ target: lesson.exercise, durationMs: 120_000, completeOnTarget: true, onComplete });

  useEffect(() => {
    session.reset();
    requestAnimationFrame(() => inputRef.current?.focus());
    // The lesson changes only when the parent selects a different lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const accuracy = Math.round(session.stats.accuracy);
  const passed = session.done && session.value.length >= lesson.exercise.length && accuracy >= lesson.goalAccuracy;
  const finger = FINGER_BY_KEY[session.currentChar.toLowerCase()] ?? lesson.finger;

  return <div className="lesson-practice-card">
    <div className="lesson-metrics">
      <div><strong>{Math.round(session.stats.netWpm)}</strong><span>WPM</span></div>
      <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
      <div><strong>{session.mistakes}</strong><span>Mistakes</span></div>
      <div><strong>{Math.round(session.progress)}%</strong><span>Progress</span></div>
    </div>
    <div className="lesson-goal-line"><span>Mastery gate: {lesson.goalAccuracy}% accuracy</span><span>Goal: {lesson.goalWpm} WPM</span></div>
    <div className="progress-track"><span style={{ width: `${session.progress}%` }} /></div>
    {!session.done ? <>
      <div className="prompt lesson-prompt" aria-label="Lesson typing text">{[...lesson.exercise].map((char, index) => <span key={`${index}-${char}`} className={index < session.value.length ? (session.value[index] === char ? 'correct' : 'incorrect') : index === session.value.length ? 'current' : ''}>{char}</span>)}</div>
      <input ref={inputRef} className="typing-input lesson-input" value={session.value} onChange={() => {}} onKeyDown={session.handleKeyDown} onPaste={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onCut={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-label={`Practice ${lesson.title}`} />
      <div className="lesson-live-guide"><span>Next key <strong>{session.currentChar === ' ' ? 'Space' : session.currentChar || '—'}</strong></span><span>Finger <strong>{finger}</strong></span><span>{session.running ? `${Math.max(0, 120 - Math.floor(session.elapsedMs / 1000))}s` : 'Ready'}</span></div>
      {showKeyboard && <VirtualKeyboard targetKey={session.currentChar || lesson.targetKeys[0]} showFingerGuide={showFingerGuide} />}
    </> : <div className={`lesson-result ${passed ? 'passed' : 'retry'} `}>
      <span className="eyebrow">{passed ? 'Lesson mastered' : 'Almost there'}</span>
      <h3>{passed ? 'You have the control this lesson is training.' : 'One more focused attempt will lock this in.'}</h3>
      <p>{passed ? `${accuracy}% accuracy at ${Math.round(session.stats.netWpm)} WPM clears the mastery gate.` : `You reached ${accuracy}% accuracy. The lesson requires ${lesson.goalAccuracy}% before the next lesson unlocks.`}</p>
      <button className={passed ? 'primary' : 'secondary'} onClick={onRetry}>{passed ? 'Practice once more' : 'Practice again'}</button>
    </div>}
  </div>;
}
