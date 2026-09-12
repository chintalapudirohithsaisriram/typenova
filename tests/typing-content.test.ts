import test from 'node:test';
import assert from 'node:assert/strict';
import { FINGER_BY_KEY, KEYBOARD_ROWS, LESSONS } from '@/lib/typing-content';

test('lesson curriculum is complete and exercises are non-empty', () => {
  assert.equal(LESSONS.length, 20);
  for (const lesson of LESSONS) {
    assert.ok(lesson.title.length > 0);
    assert.ok(lesson.exercise.length > 0);
    assert.ok(lesson.targetKeys.length > 0);
  }
});

test('lesson content matches its instructional type', () => {
  const numberLesson = LESSONS.find((lesson) => lesson.id === 'numbers');
  const punctuationLesson = LESSONS.find((lesson) => lesson.id === 'punctuation');
  assert.ok(numberLesson);
  assert.ok(/^[0-9 ]+$/.test(numberLesson.exercise));
  assert.ok(punctuationLesson);
  assert.ok(/[,.!;:]/.test(punctuationLesson.exercise));
});

test('keyboard rows cover the mapped letter and number keys', () => {
  const keyboardKeys = new Set(KEYBOARD_ROWS.flat());
  for (const key of ['a', 'f', 'j', 'l', 'q', 'm', '1', '5', '0']) {
    assert.ok(keyboardKeys.has(key));
    assert.ok(FINGER_BY_KEY[key]);
  }
  assert.equal(FINGER_BY_KEY[' '], 'thumbs');
});
