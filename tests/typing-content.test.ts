import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, formatDuration, getLessonDurationSeconds } from '@/lib/typing-content';

test('lesson durations are long enough for their learning stage', () => {
  assert.equal(getLessonDurationSeconds(LESSONS[0]), 180);
  assert.equal(getLessonDurationSeconds(LESSONS[7]), 240);
  assert.equal(getLessonDurationSeconds(LESSONS[13]), 300);
  assert.equal(getLessonDurationSeconds(LESSONS[19]), 300);
});

test('duration formatting never shows ambiguous minute values', () => {
  assert.equal(formatDuration(15), '15s');
  assert.equal(formatDuration(59), '59s');
  assert.equal(formatDuration(60), '1:00');
  assert.equal(formatDuration(125), '2:05');
  assert.equal(formatDuration(300), '5:00');
});

test('lesson content matches its instructional type', () => {
  const numberLesson = LESSONS.find((lesson) => lesson.id === 'numbers');
  const punctuationLesson = LESSONS.find((lesson) => lesson.id === 'punctuation');
  assert.ok(numberLesson);
  assert.ok(/^[0-9 ]+$/.test(numberLesson.exercise));
  assert.ok(punctuationLesson);
  assert.ok(/[,.!;:]/.test(punctuationLesson.exercise));
});
