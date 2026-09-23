'use client';

import { useEffect, useRef } from 'react';
import { useTypingSession } from '@/lib/typing-session';
import { FINGER_BY_KEY } from '@/lib/typing-content';
import type { Lesson } from '@/lib/typing-content';
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
  const session = useTypingSession({ target: lesson.exercise, completeOnTarget: true, onComplete });

  const focus = () => requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));

  useEffect(() => {
    session.reset();
    focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const accuracy = Math.round(session.stats.accuracy);
  const wpm = Math.round(session.stats.netWpm);
  const lessonChars = Array.from(lesson.exercise);
  const lessonTypedChars = Array.from(session.value);
  const lessonCurrentIndex = lessonTypedChars.length;
  let lessonWordStart = lessonCurrentIndex;
  let lessonWordEnd = lessonCurrentIndex;
  while (lessonWordStart > 0 && lessonChars[lessonWordStart - 1] !== ' ') lessonWordStart -= 1;
  while (lessonWordEnd < lessonChars.length && lessonChars[lessonWordEnd] !== ' ') lessonWordEnd += 1;
  const passed = session.done && [...session.value].length >= [...lesson.exercise].length && accuracy >= lesson.goalAccuracy && wpm >= lesson.goalWpm;
  const finger = FINGER_BY_KEY[session.currentChar.toLowerCase()] ?? lesson.finger;
  const retry = () => {
    session.reset();
    focus();
    onRetry();
  };

  return <div className="lesson-practice-card learn-lesson-shell">
    <div className="learn-lesson-header">
      <div>
        <span className="eyebrow">Lesson {lesson.level} of 20</span>
        <h2>{lesson.title}</h2>
        <p>{lesson.description}</p>
      </div>
      <div className="learn-lesson-actions">
        <span className="lesson-status">Unlimited typing</span>
        <button className="secondary" type="button" onClick={retry}>Restart</button>
      </div>
    </div>

    <div className="lesson-metrics">
      <div><strong>{wpm}</strong><span>Net WPM</span></div>
      <div><strong>{session.value.length ? `${accuracy}%` : '—'}</strong><span>Accuracy</span></div>
      <div><strong>{session.mistakes || '—'}</strong><span>Errors</span></div>
      <div><strong>{session.value.length ? `${Math.round(session.stats.realAccuracy)}%` : '—'}</strong><span>Real accuracy</span></div>
      <div><strong>{Math.round(session.progress)}%</strong><span>Progress</span></div>
      <div><strong>{session.value.length ? `${Math.floor(session.elapsedMs / 60_000)}:${String(Math.floor((session.elapsedMs % 60_000) / 1000)).padStart(2, '0')}` : '—'}</strong><span>Active time</span></div>
    </div>

    <div className="lesson-goal-line">
      <span>Type at your pace · no countdown</span>
      <span>Goal: {lesson.goalAccuracy}% accuracy · {lesson.goalWpm} WPM</span>
    </div>
    <div className="progress-track" aria-label={`Lesson progress ${Math.round(session.progress)}%`}><span style={{ width: `${session.progress}%` }} /></div>

    {!session.done ? <>
      <div className="learn-typing-instructions">
        <div><strong>Type the text below</strong><span>Keep your eyes on the next character and let your fingers return to home row.</span></div>
        <button className="secondary" type="button" onClick={focus}>Focus typing</button>
      </div>

      <div className="lesson-typing-surface">
        <div
          className="prompt lesson-prompt"
          role="textbox"
          tabIndex={0}
          onPointerDown={(event) => { event.preventDefault(); focus(); }}
          aria-label="Lesson typing text"
          aria-describedby="lesson-input-help"
        >
          {lessonChars.map((char, index) => {
            const typedChar = lessonTypedChars[index];
            const isActiveWord = index >= lessonWordStart && index < lessonWordEnd && lessonWordStart < lessonWordEnd;
            const className = [
              index < lessonTypedChars.length ? (typedChar === char ? 'correct' : 'incorrect') : '',
              isActiveWord ? 'active-word' : '',
              index === lessonCurrentIndex ? 'current' : '',
            ].filter(Boolean).join(' ');
            return <span key={`${index}-${char}`} className={className} aria-current={index === lessonCurrentIndex ? 'true' : undefined}>{char}</span>;
          })}
        </div>
        <input
          ref={inputRef}
          className="typing-input lesson-input"
          value={session.value}
          onChange={(event) => session.handleInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace') session.handleKeyDown(event);
          }}
          onPaste={(event) => event.preventDefault()}
          onCopy={(event) => event.preventDefault()}
          onCut={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          onDragOver={(event) => event.preventDefault()}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          aria-label={`Type ${lesson.title}`}
        />
      </div>
      <p id="lesson-input-help" className="sr-only">Type directly into the lesson text. The hand and finger guide is visual only and does not type for you.</p>

      <div className="lesson-live-guide" aria-live="polite">
        <span>Next key <strong>{session.currentChar === ' ' ? 'Space' : session.currentChar || '—'}</strong></span>
        <span>Finger <strong>{finger}</strong></span>
        <span>{session.running ? `${Math.floor(session.elapsedMs / 60_000)}:${String(Math.floor((session.elapsedMs % 60_000) / 1000)).padStart(2, '0')} active` : 'Ready'}</span>
      </div>

      {showKeyboard && <VirtualKeyboard targetKey={session.currentChar || lesson.targetKeys[0]} showFingerGuide={showFingerGuide} onKeySelect={session.handleVirtualKey} />}
    </> : <div className={`lesson-result ${passed ? 'passed' : 'retry'}`}>
      <span className="eyebrow">{passed ? 'Lesson mastered' : 'Exercise complete'}</span>
      <h3>{passed ? 'You cleared both mastery gates.' : 'You finished the exercise. Keep practicing to improve the score.'}</h3>
      <p>{passed ? `${accuracy}% accuracy at ${wpm} WPM meets the lesson target.` : `You reached ${accuracy}% accuracy at ${wpm} WPM. Target: ${lesson.goalAccuracy}% accuracy and ${lesson.goalWpm} WPM.`}</p>
      <button className={passed ? 'primary' : 'secondary'} type="button" onClick={retry}>{passed ? 'Practice again' : 'Retry lesson'}</button>
    </div>}

    <style jsx>{`
      .learn-lesson-shell{padding:0;overflow:hidden}
      .learn-lesson-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:24px 26px 20px;border-bottom:1px solid var(--line);background:var(--surface)}
      .learn-lesson-header h2{margin:4px 0 5px;font-size:clamp(1.35rem,2vw,1.8rem);letter-spacing:-.025em}
      .learn-lesson-header p{margin:0;max-width:680px;color:var(--muted);font-size:13px;line-height:1.55}
      .learn-lesson-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}.lesson-status{font-size:11px;font-weight:800;color:var(--muted);padding:8px 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface-soft)}
      .lesson-metrics{padding:18px 26px 0}.lesson-goal-line{padding:12px 26px 8px}
      .learn-typing-instructions{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 26px 10px}.learn-typing-instructions div{display:grid;gap:3px}.learn-typing-instructions strong{font-size:13px}.learn-typing-instructions span{font-size:11px;color:var(--muted)}
      .lesson-typing-surface{position:relative;margin:0 26px;border:1px solid var(--line);border-radius:18px;background:var(--surface);min-height:220px;cursor:text;overflow:hidden}
      .lesson-prompt{position:relative;z-index:1;min-height:220px;padding:34px 36px;font-size:clamp(1.35rem,2.15vw,2rem);line-height:1.75;letter-spacing:.015em;outline:none}
      .lesson-input{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;background:transparent;color:transparent;caret-color:transparent;outline:none;opacity:0;z-index:2}
      .lesson-live-guide{margin:12px 26px 0;padding:11px 14px;border:1px solid var(--line);border-radius:12px;display:flex;gap:18px;flex-wrap:wrap;background:var(--surface-soft);font-size:11px;color:var(--muted)}.lesson-live-guide strong{color:var(--ink);font-family:var(--mono)}
      @media(max-width:720px){.learn-lesson-header{display:grid}.learn-lesson-actions{justify-content:space-between}.lesson-metrics{padding-left:16px;padding-right:16px}.lesson-goal-line,.learn-typing-instructions{padding-left:16px;padding-right:16px}.lesson-typing-surface{margin:0 16px}.lesson-prompt{padding:24px 20px;min-height:190px}.lesson-live-guide{margin-left:16px;margin-right:16px}}
    `}</style>
  </div>;
}
