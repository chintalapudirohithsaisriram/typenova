export type SessionPoint = {
  id: string; date: string; durationMs: number; wpm: number; rawWpm: number; accuracy: number; errors: number;
  correct: number; incorrect: number; typed: number; consistency: number; mode: string;
};
export type KeyStat = {
  key: string; attempts: number; correct: number; incorrect: number; accuracy: number; mastery: number;
  recentAttempts: number; recentCorrect: number; lastSeen: string;
};
export type ProfileState = {
  sessions: SessionPoint[];
  keyStats: Record<string, KeyStat>;
  completedLessons: string[];
  masteredLessons: string[];
  xp: number;
  streak: number;
  longestStreak: number;
  practiceDaysThisMonth: number;
  lastPracticeDate: string | null;
  onboardingComplete: boolean;
  goal: 'learn' | 'speed' | 'accuracy' | 'exam' | 'casual';
  level: 'beginner' | 'intermediate' | 'advanced';
  theme: 'light' | 'dark' | 'system';
  fontScale: 'small' | 'medium' | 'large';
  sound: boolean;
  animations: boolean;
  focusMode: boolean;
  achievements: string[];
  mistakePairs: Record<string, number>;
};

export const KEY = 'typenova-profile-v3';
const LEGACY_KEY = 'typenova-profile-v2';
const DAY = 86_400_000;

export const defaultProfile: ProfileState = {
  sessions: [], keyStats: {}, completedLessons: [], masteredLessons: [], xp: 0, streak: 0, longestStreak: 0,
  practiceDaysThisMonth: 0, lastPracticeDate: null, onboardingComplete: false, goal: 'speed', level: 'beginner',
  theme: 'system', fontScale: 'medium', sound: false, animations: true, focusMode: false, achievements: [], mistakePairs: {},
};

function localDateKey(value = new Date()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalize(raw: Partial<ProfileState>): ProfileState {
  return {
    ...defaultProfile,
    ...raw,
    sessions: Array.isArray(raw.sessions) ? raw.sessions.slice(-500) : [],
    completedLessons: Array.isArray(raw.completedLessons) ? raw.completedLessons : [],
    masteredLessons: Array.isArray(raw.masteredLessons) ? raw.masteredLessons : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    keyStats: raw.keyStats ?? {}, mistakePairs: raw.mistakePairs ?? {},
  };
}

export function loadProfile(): ProfileState {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const current = localStorage.getItem(KEY);
    if (current) return normalize(JSON.parse(current));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = normalize(JSON.parse(legacy));
      saveProfile(migrated);
      return migrated;
    }
    const oldHistory = JSON.parse(localStorage.getItem('typenova-history') ?? '[]') as Array<{ date: string; wpm: number; accuracy: number; errors: number }>;
    const oldLessons = JSON.parse(localStorage.getItem('typenova-lessons') ?? '[]') as string[];
    const oldXp = safeNumber(Number(localStorage.getItem('typenova-xp') ?? 0));
    const oldStreak = safeNumber(Number(localStorage.getItem('typenova-streak') ?? 0));
    if (oldHistory.length || oldLessons.length || oldXp || oldStreak) {
      const migrated = normalize({
        onboardingComplete: true,
        sessions: oldHistory.map((item, index) => ({
          id: `legacy-${index}`, date: item.date, durationMs: 60_000, wpm: item.wpm, rawWpm: item.wpm,
          accuracy: item.accuracy, errors: item.errors, correct: 0, incorrect: item.errors, typed: item.errors,
          consistency: 0, mode: 'legacy',
        })),
        completedLessons: oldLessons, xp: oldXp, streak: oldStreak, longestStreak: oldStreak,
      });
      saveProfile(migrated);
      return migrated;
    }
    return defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: ProfileState) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch {}
}

function updateStreak(profile: ProfileState, date = new Date()) {
  const today = localDateKey(date);
  if (profile.lastPracticeDate === today) return { streak: profile.streak, longestStreak: profile.longestStreak, lastPracticeDate: today };
  const last = profile.lastPracticeDate ? Date.parse(`${profile.lastPracticeDate}T12:00:00`) : 0;
  const now = Date.parse(`${today}T12:00:00`);
  const nextStreak = last && now - last === DAY ? profile.streak + 1 : 1;
  return { streak: nextStreak, longestStreak: Math.max(profile.longestStreak, nextStreak), lastPracticeDate: today };
}

function updateAchievements(profile: ProfileState, session: SessionPoint) {
  const unlocked = new Set(profile.achievements);
  const tests = profile.sessions.length + 1;
  const bestWpm = Math.max(0, ...profile.sessions.map((item) => item.wpm), session.wpm);
  const rules: Array<[string, boolean]> = [
    ['first-test', tests >= 1], ['speed-30', bestWpm >= 30], ['speed-40', bestWpm >= 40], ['speed-50', bestWpm >= 50],
    ['speed-75', bestWpm >= 75], ['accuracy-95', session.accuracy >= 95], ['accuracy-99', session.accuracy >= 99],
    ['ten-tests', tests >= 10], ['hundred-tests', tests >= 100],
  ];
  rules.forEach(([id, condition]) => { if (condition) unlocked.add(id); });
  return [...unlocked];
}

export function addSession(profile: ProfileState, session: Omit<SessionPoint, 'id' | 'date'>): ProfileState {
  const normalized = { ...session, typed: session.typed ?? session.correct + session.incorrect, consistency: session.consistency ?? 0 };
  const point: SessionPoint = {
    ...normalized,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };
  const streak = updateStreak(profile);
  const next = normalize({
    ...profile,
    sessions: [...profile.sessions, point].slice(-500),
    xp: profile.xp + Math.max(10, Math.round(point.wpm / 2 + point.accuracy / 10)),
    achievements: updateAchievements(profile, point),
    ...streak,
  });
  next.practiceDaysThisMonth = countPracticeDays(next.sessions, new Date().getFullYear(), new Date().getMonth());
  saveProfile(next);
  return next;
}

export function addLesson(profile: ProfileState, lessonId: string, mastered = false): ProfileState {
  if (profile.completedLessons.includes(lessonId)) return profile;
  const next = normalize({
    ...profile,
    completedLessons: [...profile.completedLessons, lessonId],
    masteredLessons: mastered ? [...profile.masteredLessons, lessonId] : profile.masteredLessons,
    xp: profile.xp + (mastered ? 40 : 25),
    ...updateStreak(profile),
  });
  next.practiceDaysThisMonth = countPracticeDays(next.sessions, new Date().getFullYear(), new Date().getMonth());
  saveProfile(next);
  return next;
}

export function recordKeyPerformance(profile: ProfileState, target: string, value: string): ProfileState {
  const keys = { ...profile.keyStats };
  const pairs = { ...profile.mistakePairs };
  const targetChars = [...target];
  let previousExpected = '';
  [...value].forEach((typed, index) => {
    const expected = (targetChars[index] ?? '').toLowerCase();
    if (!expected || !/[a-z0-9;,./'`\- ]/.test(expected)) return;
    const correct = typed.toLowerCase() === expected;
    const previous = keys[expected] ?? { key: expected, attempts: 0, correct: 0, incorrect: 0, accuracy: 100, mastery: 50, recentAttempts: 0, recentCorrect: 0, lastSeen: '' };
    const attempts = previous.attempts + 1;
    const correctCount = previous.correct + (correct ? 1 : 0);
    const incorrect = previous.incorrect + (correct ? 0 : 1);
    const recentAttempts = Math.min(30, previous.recentAttempts + 1);
    const recentCorrect = Math.min(recentAttempts, previous.recentCorrect + (correct ? 1 : 0));
    const recentAccuracy = recentAttempts ? recentCorrect / recentAttempts * 100 : 0;
    const longAccuracy = attempts ? correctCount / attempts * 100 : 0;
    const mastery = Math.max(0, Math.min(100, recentAccuracy * 0.55 + longAccuracy * 0.25 + Math.min(100, attempts / 25 * 100) * 0.2));
    keys[expected] = { key: expected, attempts, correct: correctCount, incorrect, accuracy: longAccuracy, mastery, recentAttempts, recentCorrect, lastSeen: new Date().toISOString() };
    if (!correct && previousExpected) {
      const pair = `${previousExpected}>${expected}`;
      pairs[pair] = (pairs[pair] ?? 0) + 1;
    }
    previousExpected = expected;
  });
  return { ...profile, keyStats: keys, mistakePairs: pairs };
}

export function weakestKeys(profile: ProfileState, limit = 4) {
  return Object.values(profile.keyStats)
    .filter((item) => item.attempts >= 3)
    .sort((a, b) => b.incorrect - a.incorrect || a.mastery - b.mastery)
    .slice(0, limit);
}

export function strongestKeys(profile: ProfileState, limit = 6) {
  return Object.values(profile.keyStats).filter((item) => item.attempts >= 5).sort((a, b) => b.mastery - a.mastery).slice(0, limit);
}

export function topMistakePairs(profile: ProfileState, limit = 3) {
  return Object.entries(profile.mistakePairs).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function countPracticeDays(sessions: SessionPoint[], year: number, month: number) {
  return new Set(sessions.filter((item) => { const date = new Date(item.date); return date.getFullYear() === year && date.getMonth() === month; }).map((item) => localDateKey(item.date))).size;
}

export function sessionsForRange(sessions: SessionPoint[], days: 7 | 30 | 90 | 365 | 'all') {
  if (days === 'all') return sessions;
  const cutoff = Date.now() - days * DAY;
  return sessions.filter((item) => Date.parse(item.date) >= cutoff);
}

export function levelFromXp(xp: number) {
  const safeXp = Math.max(0, safeNumber(xp));
  const level = Math.floor(safeXp / 500) + 1;
  const within = safeXp % 500;
  const names = ['Starter', 'Beginner', 'Learner', 'Typist', 'Skilled', 'Advanced', 'Expert', 'Master', 'Nova'];
  return { level, name: names[Math.min(names.length - 1, level - 1)], within, next: 500 };
}

export function coachMessage(profile: ProfileState) {
  const weak = weakestKeys(profile, 2);
  if (!profile.sessions.length) return 'Take a 60-second baseline. TypeNova will use your real result to decide what to train next.';
  if (weak.length) return `${weak.map((item) => item.key.toUpperCase()).join(' + ')} are currently your biggest opportunities. Practice them slowly at high accuracy before adding speed.`;
  const recent = profile.sessions.slice(-5);
  const avg = recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length;
  if (avg < 95) return 'Your next lever is accuracy. Slow down slightly, eliminate repeat mistakes, then retest.';
  return 'Your fundamentals look stable. Add short speed bursts while protecting your accuracy and consistency.';
}

export function personalBests(profile: ProfileState) {
  return {
    wpm: Math.max(0, ...profile.sessions.map((item) => item.wpm)),
    accuracy: Math.max(0, ...profile.sessions.map((item) => item.accuracy)),
    consistency: Math.max(0, ...profile.sessions.map((item) => item.consistency)),
    characters: profile.sessions.reduce((sum, item) => sum + item.typed, 0),
    practiceMs: profile.sessions.reduce((sum, item) => sum + item.durationMs, 0),
  };
}

export function consistency(values: number[]) {
  if (values.length < 2) return values.length ? 100 : 0;
  const clean = values.filter((value) => Number.isFinite(value) && value >= 0);
  if (clean.length < 2) return 0;
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length;
  if (!mean) return 0;
  const variance = clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / clean.length;
  return Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / mean) * 100));
}
