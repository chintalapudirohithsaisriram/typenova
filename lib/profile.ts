export type SessionPoint = {
  id: string; date: string; durationMs: number; wpm: number; rawWpm: number; accuracy: number; errors: number; correct: number; incorrect: number; mode: string;
};
export type KeyStat = { key: string; attempts: number; correct: number; incorrect: number; accuracy: number; mastery: number };
export type ProfileState = {
  sessions: SessionPoint[]; keyStats: Record<string, KeyStat>; completedLessons: string[]; xp: number; streak: number; longestStreak: number;
  lastPracticeDate: string | null; onboardingComplete: boolean; goal: 'learn' | 'speed' | 'accuracy' | 'exam' | 'casual';
  level: 'beginner' | 'intermediate' | 'advanced'; theme: 'light' | 'dark' | 'system';
};
const KEY = 'typenova-profile-v2'; const DAY = 86_400_000;
export const defaultProfile: ProfileState = { sessions: [], keyStats: {}, completedLessons: [], xp: 0, streak: 0, longestStreak: 0, lastPracticeDate: null, onboardingComplete: false, goal: 'speed', level: 'beginner', theme: 'system' };

export function loadProfile(): ProfileState {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) } as ProfileState;
    const oldHistory = JSON.parse(localStorage.getItem('typenova-history') ?? '[]') as Array<{ date: string; wpm: number; accuracy: number; errors: number }>;
    const oldLessons = JSON.parse(localStorage.getItem('typenova-lessons') ?? '[]') as string[];
    const oldXp = Number(localStorage.getItem('typenova-xp') ?? 0);
    const oldStreak = Number(localStorage.getItem('typenova-streak') ?? 0);
    if (oldHistory.length || oldLessons.length || oldXp || oldStreak) {
      const migrated: ProfileState = {
        ...defaultProfile,
        onboardingComplete: true,
        sessions: oldHistory.map((item, index) => ({ id: `legacy-${index}`, date: item.date, durationMs: 60_000, wpm: item.wpm, rawWpm: item.wpm, accuracy: item.accuracy, errors: item.errors, correct: 0, incorrect: item.errors, mode: 'legacy' })),
        completedLessons: oldLessons, xp: oldXp, streak: oldStreak, longestStreak: oldStreak,
      };
      saveProfile(migrated); return migrated;
    }
    return defaultProfile;
  } catch { return defaultProfile; }
}
export function saveProfile(profile: ProfileState) { if (typeof window !== 'undefined') { try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch {} } }
function dateKey(value = new Date()) { return new Date(value).toISOString().slice(0, 10); }
function updateStreak(profile: ProfileState, date = new Date()): Pick<ProfileState, 'streak' | 'longestStreak' | 'lastPracticeDate'> {
  const today = dateKey(date); if (profile.lastPracticeDate === today) return { streak: profile.streak, longestStreak: profile.longestStreak, lastPracticeDate: today };
  const last = profile.lastPracticeDate ? Date.parse(`${profile.lastPracticeDate}T00:00:00Z`) : 0; const now = Date.parse(`${today}T00:00:00Z`);
  const nextStreak = last && now - last === DAY ? profile.streak + 1 : 1; return { streak: nextStreak, longestStreak: Math.max(profile.longestStreak, nextStreak), lastPracticeDate: today };
}
export function addSession(profile: ProfileState, session: Omit<SessionPoint, 'id' | 'date'>): ProfileState {
  const next = { ...profile, sessions: [...profile.sessions, { ...session, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: new Date().toISOString() }].slice(-200), xp: profile.xp + Math.max(10, Math.round(session.wpm / 2 + session.accuracy / 10)), ...updateStreak(profile) };
  saveProfile(next); return next;
}
export function addLesson(profile: ProfileState, lessonId: string): ProfileState { if (profile.completedLessons.includes(lessonId)) return profile; const next = { ...profile, completedLessons: [...profile.completedLessons, lessonId], xp: profile.xp + 25, ...updateStreak(profile) }; saveProfile(next); return next; }
export function recordKeyPerformance(profile: ProfileState, target: string, value: string): ProfileState {
  const keys = { ...profile.keyStats }; const targetChars = [...target];
  [...value].forEach((char, index) => {
    const expected = (targetChars[index] ?? char).toLowerCase(); if (!/[a-z0-9;,./'`\- ]/.test(expected)) return;
    const correct = char.toLowerCase() === expected; const previous = keys[expected] ?? { key: expected, attempts: 0, correct: 0, incorrect: 0, accuracy: 100, mastery: 50 };
    const attempts = previous.attempts + 1; const correctCount = previous.correct + (correct ? 1 : 0); const incorrect = previous.incorrect + (correct ? 0 : 1);
    const accuracy = (correctCount / attempts) * 100; const mastery = Math.min(100, Math.max(0, accuracy * 0.75 + Math.min(100, attempts / 20 * 100) * 0.25));
    keys[expected] = { key: expected, attempts, correct: correctCount, incorrect, accuracy, mastery };
  }); return { ...profile, keyStats: keys };
}
export function weakestKeys(profile: ProfileState, limit = 3) { return Object.values(profile.keyStats).filter((item) => item.attempts >= 3).sort((a, b) => a.mastery - b.mastery).slice(0, limit); }
export function levelFromXp(xp: number) { const level = Math.floor(Math.max(0, xp) / 500) + 1; const within = Math.max(0, xp) % 500; const names = ['Starter', 'Learner', 'Typist', 'Skilled', 'Advanced', 'Expert', 'Master', 'Nova']; return { level, name: names[Math.min(names.length - 1, level - 1)], within, next: 500 }; }
export function coachMessage(profile: ProfileState) {
  const weak = weakestKeys(profile, 2); if (!profile.sessions.length) return 'Start with a 60-second test. I’ll use the result to build your first training plan.';
  if (weak.length) return `Your biggest opportunity is ${weak.map((x) => x.key.toUpperCase()).join(' + ')}. A short targeted drill should improve control before you chase more speed.`;
  const recent = profile.sessions.slice(-5); const avg = recent.reduce((sum, x) => sum + x.accuracy, 0) / recent.length;
  if (avg < 95) return 'Your speed is useful, but accuracy is the next lever. Slow down slightly and make every keystroke intentional.';
  return 'Your fundamentals are holding up. Add short speed bursts, then retest to turn consistency into higher WPM.';
}
export function consistency(values: number[]) { if (values.length < 2) return values.length ? 100 : 0; const mean = values.reduce((a, b) => a + b, 0) / values.length; if (!mean) return 0; const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length; return Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / mean) * 100)); }
export { KEY };
