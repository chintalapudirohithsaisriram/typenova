import test from 'node:test';
import assert from 'node:assert/strict';
import { addLesson, defaultProfile, levelFromXp, recordKeyPerformance, sessionsForRange, weakestKeys } from '@/lib/profile';

test('XP levels advance predictably', () => {
  assert.deepEqual(levelFromXp(0), { level: 1, name: 'Starter', within: 0, next: 500 });
  assert.equal(levelFromXp(500).level, 2);
  assert.equal(levelFromXp(999).within, 499);
});

test('lesson completion is idempotent', () => {
  const first = addLesson(defaultProfile, 'home-row', true);
  const second = addLesson(first, 'home-row', true);
  assert.equal(first.xp, 40);
  assert.equal(second.xp, 40);
  assert.deepEqual(second.completedLessons, ['home-row']);
  assert.deepEqual(second.masteredLessons, ['home-row']);
});

test('key performance is based on expected target keys', () => {
  const next = recordKeyPerformance(defaultProfile, 'asdf', 'asxf');
  assert.equal(next.keyStats.a.correct, 1);
  assert.equal(next.keyStats.s.correct, 1);
  assert.equal(next.keyStats.d.incorrect, 1);
  assert.equal(next.keyStats.f.correct, 1);
  assert.ok(weakestKeys(next, 1)[0]?.key === 'd');
});

test('range filtering uses actual session dates', () => {
  const now = Date.now();
  const sessions = [
    { id:'a', date:new Date(now - 2 * 86_400_000).toISOString() } as never,
    { id:'b', date:new Date(now - 40 * 86_400_000).toISOString() } as never,
  ];
  assert.equal(sessionsForRange(sessions, 7).length, 1);
  assert.equal(sessionsForRange(sessions, 30).length, 1);
  assert.equal(sessionsForRange(sessions, 'all').length, 2);
});
