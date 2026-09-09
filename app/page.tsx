'use client';

import { useEffect, useMemo, useState } from 'react';
import TypingTest from '@/components/TypingTest';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { LESSONS, FINGER_BY_KEY } from '@/lib/typing-content';
import type { TypingStats } from '@/lib/typing';

type View = 'home' | 'learn' | 'practice' | 'test' | 'games' | 'challenges' | 'stats';
type HistoryItem = { date: string; wpm: number; accuracy: number; errors: number };

const nav: { label: string; view: View }[] = [
  { label: 'Learn', view: 'learn' }, { label: 'Practice', view: 'practice' }, { label: 'Test', view: 'test' },
  { label: 'Games', view: 'games' }, { label: 'Challenges', view: 'challenges' }, { label: 'Stats', view: 'stats' },
];

function useProfile() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem('typenova-history') ?? '[]'));
      setCompleted(JSON.parse(localStorage.getItem('typenova-lessons') ?? '[]'));
      setXp(Number(localStorage.getItem('typenova-xp') ?? 0));
      setStreak(Number(localStorage.getItem('typenova-streak') ?? 0));
    } catch {}
  }, []);
  const record = (stats: TypingStats, earned = 10) => {
    const item = { date: new Date().toISOString(), wpm: Math.round(stats.netWpm), accuracy: Math.round(stats.accuracy), errors: stats.errors };
    setHistory((old) => { const next = [...old, item].slice(-30); try { localStorage.setItem('typenova-history', JSON.stringify(next)); } catch {} return next; });
    setXp((old) => { const next = old + earned; try { localStorage.setItem('typenova-xp', String(next)); } catch {} return next; });
    setStreak((old) => { const next = Math.max(1, old); try { localStorage.setItem('typenova-streak', String(next)); } catch {} return next; });
  };
  const completeLesson = (id: string) => {
    setCompleted((old) => { if (old.includes(id)) return old; const next = [...old, id]; try { localStorage.setItem('typenova-lessons', JSON.stringify(next)); } catch {} return next; });
    setXp((old) => { const next = old + 20; try { localStorage.setItem('typenova-xp', String(next)); } catch {} return next; });
  };
  return { history, completed, xp, streak, record, completeLesson };
}

function Brand() { return <button className="brand brand-button" onClick={() => window.location.hash = ''}><span className="brand-mark">T</span><span>TypeNova</span></button>; }

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [focus, setFocus] = useState(false);
  const profile = useProfile();
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = LESSONS[lessonIndex];
  const [lessonValue, setLessonValue] = useState('');
  const [practiceMode, setPracticeMode] = useState<'accuracy' | 'speed'>('accuracy');
  const [gameScore, setGameScore] = useState(0);
  const [gameKey, setGameKey] = useState('f');

  const bestWpm = useMemo(() => profile.history.length ? Math.max(...profile.history.map((x) => x.wpm)) : 0, [profile.history]);
  const averageWpm = useMemo(() => profile.history.length ? Math.round(profile.history.reduce((a, x) => a + x.wpm, 0) / profile.history.length) : 0, [profile.history]);
  const averageAccuracy = useMemo(() => profile.history.length ? Math.round(profile.history.reduce((a, x) => a + x.accuracy, 0) / profile.history.length) : 100, [profile.history]);

  const go = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleTestComplete = (stats: TypingStats) => profile.record(stats, 10 + Math.round(stats.accuracy / 10));
  const submitLesson = () => {
    const target = lesson.exercise;
    if (lessonValue.length < target.length) return;
    profile.completeLesson(lesson.id);
    setLessonValue('');
    if (lessonIndex < LESSONS.length - 1) setLessonIndex((i) => i + 1);
  };

  if (focus) return <main className="focus-shell"><div className="focus-bar"><Brand /><button className="ghost" onClick={() => setFocus(false)}>Exit focus</button></div><TypingTest onComplete={handleTestComplete} /></main>;

  return <main>
    <header className="nav"><Brand /><nav aria-label="Main navigation">{nav.map((item) => <button key={item.view} className={view === item.view ? 'nav-link active' : 'nav-link'} onClick={() => go(item.view)}>{item.label}</button>)}</nav><button className="ghost" onClick={() => setFocus(true)}>Focus mode</button></header>

    {view === 'home' && <>
      <section className="hero"><div className="hero-copy"><span className="eyebrow">Learn · Practice · Test · Improve</span><h1>Master Your <em>Keyboard.</em></h1><p>Learn to type correctly. Build speed. Improve accuracy. Become faster every day with a focused practice system.</p><div className="hero-actions"><button className="primary" onClick={() => go('test')}>Take a test</button><button className="secondary" onClick={() => go('learn')}>Start learning <span>↗</span></button></div><div className="quick-links"><button onClick={() => go('practice')}>Practice</button><button onClick={() => go('stats')}>View progress</button><button onClick={() => setFocus(true)}>Focus mode</button></div></div><div className="hero-orbit"><div className="orbit-card"><span>Today</span><strong>{profile.streak} day{profile.streak === 1 ? '' : 's'}</strong><small>keep the habit going</small></div><div className="key-float k1">F</div><div className="key-float k2">J</div><div className="key-float k3">A</div><div className="key-float k4">;</div></div></section>
      <section className="stats-strip"><div><span>Best WPM</span><strong>{bestWpm || '—'}</strong></div><div><span>Accuracy</span><strong>{averageAccuracy}%</strong></div><div><span>Daily streak</span><strong>{profile.streak} days</strong></div><div><span>Level</span><strong>{Math.floor(profile.xp / 100) + 1} · {profile.xp < 100 ? 'Starter' : 'Growing'}</strong></div><div><span>XP</span><strong>{profile.xp % 100} / 100</strong></div></section>
      <section className="section"><TypingTest onComplete={handleTestComplete} /></section>
      <section className="learning"><div><span className="eyebrow">Your first steps</span><h2>Build technique before chasing speed.</h2><p>TypeNova teaches touch typing as a loop: understand the movement, practice it, get immediate feedback, then unlock the next skill.</p><button className="primary" onClick={() => go('learn')}>Open learning path</button></div><div className="lesson-grid">{LESSONS.slice(0, 3).map((item, i) => <article key={item.id}><span>0{i + 1}</span><h3>{item.title}</h3><p>{item.description}</p><button onClick={() => { setLessonIndex(i); go('learn'); }}>Practice lesson →</button></article>)}</div></section>
    </>}

    {view === 'learn' && <section className="app-page"><div className="page-heading"><span className="eyebrow">Learn</span><h2>A curriculum that builds real technique.</h2><p>Progress from hand position to fluent, accurate passages. Every lesson includes explanation, guidance, practice, feedback, and a completion condition.</p></div><div className="learning-layout"><aside className="curriculum">{Array.from({ length: 6 }, (_, level) => <div key={level} className="level-block"><small>LEVEL {level + 1}</small>{LESSONS.filter((x) => x.level === level + 1).map((item) => <button key={item.id} className={lesson.id === item.id ? 'lesson-nav selected' : 'lesson-nav'} onClick={() => { setLessonIndex(LESSONS.findIndex((x) => x.id === item.id)); setLessonValue(''); }}>{profile.completed.includes(item.id) ? '✓ ' : ''}{item.title}</button>)}</div>)}</aside><div className="lesson-stage"><span className="eyebrow">Level {lesson.level} · Lesson {lessonIndex + 1}</span><h3>{lesson.title}</h3><p>{lesson.description}</p><div className="lesson-guidance"><div><strong>Target keys</strong><span>{lesson.targetKeys.join(' · ')}</span></div><div><strong>Finger guidance</strong><span>{lesson.finger}</span></div></div><VirtualKeyboard targetKey={lesson.targetKeys[0] === 'all' ? 'f' : lesson.targetKeys[0]} /><div className="lesson-practice"><label htmlFor="lesson-input">Practice this pattern</label><div className="lesson-prompt">{[...lesson.exercise].map((c, i) => <span key={i} className={i < lessonValue.length ? (lessonValue[i] === c ? 'correct' : 'incorrect') : i === lessonValue.length ? 'current' : ''}>{c}</span>)}</div><input id="lesson-input" className="typing-input" value={lessonValue} onChange={(e) => setLessonValue(e.target.value.slice(0, lesson.exercise.length))} autoComplete="off" spellCheck={false} aria-describedby="lesson-help" /><small id="lesson-help">{lessonValue.length}/{lesson.exercise.length} characters · {lessonValue.length === lesson.exercise.length ? 'Lesson complete — continue.' : 'Accuracy first. Backspace and try again.'}</small><div className="test-actions"><button className="primary" disabled={lessonValue.length < lesson.exercise.length} onClick={submitLesson}>Complete & continue</button><span>{profile.completed.includes(lesson.id) ? 'Completed' : `${Math.round((lessonValue.length / lesson.exercise.length) * 100)}% practiced`}</span></div></div></div></div></section>}

    {view === 'practice' && <section className="app-page"><div className="page-heading"><span className="eyebrow">Practice</span><h2>Train the skill you need today.</h2><p>Choose a mode and use the same feedback loop as the test engine, without the pressure of a timed result.</p></div><div className="practice-tabs"><button className={practiceMode === 'accuracy' ? 'chip active' : 'chip'} onClick={() => setPracticeMode('accuracy')}>Accuracy mode</button><button className={practiceMode === 'speed' ? 'chip active' : 'chip'} onClick={() => setPracticeMode('speed')}>Speed mode</button></div><div className="practice-grid"><article className="feature-card"><span className="eyebrow">Focused drill</span><h3>{practiceMode === 'accuracy' ? 'Clean keystrokes' : 'Build pace'}</h3><p>{practiceMode === 'accuracy' ? 'Repeat short patterns and prioritize error-free movement.' : 'Use a short timed test to nudge your speed while keeping technique stable.'}</p><button className="primary" onClick={() => go(practiceMode === 'accuracy' ? 'learn' : 'test')}>{practiceMode === 'accuracy' ? 'Start a drill' : 'Start speed test'}</button></article><article className="feature-card"><span className="eyebrow">Weak-key practice</span><h3>Target difficult keys</h3><p>Your next adaptive layer can use per-key error frequency. For now, TypeNova exposes the same finger map used by lessons.</p><VirtualKeyboard targetKey="r" /></article></div></section>}

    {view === 'test' && <section className="app-page"><div className="page-heading"><span className="eyebrow">Test</span><h2>Measure your typing honestly.</h2><p>Choose 15 seconds to warm up or up to five minutes for a deeper sample. Results use character-based WPM and accuracy.</p></div><TypingTest onComplete={handleTestComplete} /></section>}

    {view === 'games' && <section className="app-page"><div className="page-heading"><span className="eyebrow">Games</span><h2>Fast feedback, without the fluff.</h2><p>Short skill games turn repetition into a challenge while keeping the keyboard technique useful.</p></div><div className="game-card"><div><span className="eyebrow">Key Sprint</span><h3>Hit the highlighted key</h3><p>Score one point for each correct key. The next target appears immediately.</p><div className="game-target">{gameKey.toUpperCase()}</div><strong className="game-score">{gameScore} points</strong></div><div className="game-controls"><button className="primary" onClick={() => { setGameScore(0); setGameKey('f'); }}>Reset game</button><div className="game-pad">{'asdfjkl;'.split('').map((key) => <button key={key} className={key === gameKey ? 'game-key target' : 'game-key'} onClick={() => { if (key === gameKey) { setGameScore((s) => s + 1); setGameKey('asdfjkl;'[(Math.floor(Math.random() * 8))]); } }}>{key}</button>)}</div></div></div></section>}

    {view === 'challenges' && <section className="app-page"><div className="page-heading"><span className="eyebrow">Challenge</span><h2>One focused goal for today.</h2><p>Complete a 30-second test at 95% accuracy or better. Your score is saved with the rest of your practice history.</p></div><div className="challenge-card"><div><span className="challenge-number">30</span><span>seconds</span></div><div><span className="challenge-number">95%</span><span>accuracy goal</span></div><div><span className="challenge-number">1</span><span>attempt to beat</span></div></div><TypingTest onComplete={(stats) => { handleTestComplete(stats); if (stats.accuracy >= 95) setXp((x) => x); }} /></section>}

    {view === 'stats' && <section className="app-page"><div className="page-heading"><span className="eyebrow">Stats</span><h2>Progress you can actually use.</h2><p>TypeNova keeps a compact local history so you can see whether practice is making you faster and more accurate.</p></div><div className="stats-overview"><div><span>Best WPM</span><strong>{bestWpm}</strong></div><div><span>Average WPM</span><strong>{averageWpm}</strong></div><div><span>Average accuracy</span><strong>{averageAccuracy}%</strong></div><div><span>Tests</span><strong>{profile.history.length}</strong></div></div><div className="history-card"><h3>Recent tests</h3>{profile.history.length === 0 ? <p className="muted">Take your first test to start building a history.</p> : <div className="history-list">{[...profile.history].reverse().slice(0, 10).map((item, i) => <div key={`${item.date}-${i}`}><span>{new Date(item.date).toLocaleDateString()}</span><strong>{item.wpm} WPM</strong><span>{item.accuracy}% accuracy</span><span>{item.errors} errors</span></div>)}</div>}</div></section>}

    <footer><Brand /><span>Learn deliberately. Type confidently.</span></footer>
  </main>;
}
