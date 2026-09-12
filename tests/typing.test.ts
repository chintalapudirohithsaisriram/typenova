import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStats, calculateWpm, compareTypedText } from '@/lib/typing';

test('WPM uses five characters per word', () => { assert.equal(calculateWpm(300, 60_000), 60); assert.equal(calculateWpm(150, 30_000), 60); assert.equal(calculateWpm(250, 60_000), 50); });
test('zero elapsed time is safe', () => { assert.equal(calculateWpm(100, 0), 0); assert.equal(calculateStats(0, 0, 0).netWpm, 0); });
test('empty typing state does not claim accuracy or consistency', () => { const stats = calculateStats(0, 0, 0); assert.equal(stats.accuracy, 0); assert.equal(stats.consistency, 0); });
test('accuracy and errors are bounded and deterministic', () => { const stats = calculateStats(90, 10, 60_000); assert.equal(stats.typed, 100); assert.equal(stats.accuracy, 90); assert.equal(stats.errors, 10); assert.equal(stats.grossWpm, 20); assert.equal(stats.netWpm, 18); });
test('corrected key errors affect net WPM without corrupting final accuracy', () => { const stats = calculateStats(100, 0, 60_000, [], 8); assert.equal(stats.accuracy, 100); assert.equal(stats.grossWpm, 20); assert.equal(stats.errors, 8); assert.equal(stats.netWpm, 18.4); });
test('all-correct typing has no error penalty', () => { const stats = calculateStats(250, 0, 60_000, [50, 50, 50]); assert.equal(stats.accuracy, 100); assert.equal(stats.grossWpm, 50); assert.equal(stats.netWpm, 50); assert.equal(stats.consistency, 100); });
test('invalid negative inputs cannot produce invalid metrics', () => { const stats = calculateStats(-5, -2, -100, [], -9); assert.equal(stats.correct, 0); assert.equal(stats.incorrect, 0); assert.equal(stats.errors, 0); assert.equal(stats.accuracy, 0); assert.equal(stats.netWpm, 0); });
test('typed text comparison counts final character correctness', () => { assert.deepEqual(compareTypedText('abcde', 'abXde'), { correct: 4, incorrect: 1 }); });
test('consistency rewards stable samples', () => { assert.equal(calculateStats(300, 0, 60_000, [60, 60, 60]).consistency, 100); assert.ok(calculateStats(300, 0, 60_000, [40, 80]).consistency < 100); });
