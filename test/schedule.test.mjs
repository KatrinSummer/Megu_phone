// When a word comes back. This is the one piece of the app that decides what
// she studies tomorrow, and it is arithmetic with no screen in it, so it can be
// checked here in a second rather than by driving a browser for two minutes.
//
// A list of checks read top to bottom; it is a test, so it may grow.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { progress, today } from '../core/store.js';
import { answer, nextIn, setPri, isMemorized } from '../study/schedule.js';

const card = { f: 'ねこ' };
const reset = () => { for (const k of Object.keys(progress)) delete progress[k]; };
const p = () => progress[card.f];
const inDays = () => p().due - today();
// The ease is added to and taken from in steps of 0.15, and 1.85 - 0.15 is
// 1.7000000000000002 in binary. Two decimals is well past anything the
// schedule can act on: a day is the smallest thing it can say.
const ease = () => Math.round(p().ease * 100) / 100;

test('knew it: 2 days, then 4, then the interval times the ease', () => {
  reset();
  assert.equal(answer(card, 'good'), false);      // false: not again today
  assert.deepEqual([p().iv, p().reps, p().total, inDays()], [2, 1, 1, 2]);
  answer(card, 'good');
  assert.deepEqual([p().iv, inDays()], [4, 4]);
  answer(card, 'good');
  assert.deepEqual([p().iv, inDays()], [8, 8]);   // 4 x 2.0
});

// Six recalls before a word is parked, not five: the reading on vocabulary
// wants eight to twelve spaced meetings, and the old ease got there in five.
test('the ladder is 2, 4, 8, 16, 32, 64 and the sixth recall parks the word', () => {
  reset();
  const rungs = [];
  for (let i = 0; i < 6; i++) { answer(card, 'good'); rungs.push(p().iv); }
  assert.deepEqual(rungs, [2, 4, 8, 16, 32, 64]);
  assert.equal(isMemorized(card), true);
  progress[card.f].iv = 32;                       // one rung back
  assert.equal(isMemorized(card), false);
});

// The four answers have to mean four different days, and on a new word they
// did not: Normal used to start at one day, and nothing fits under that.
test('a new word: the four answers are four different days', () => {
  reset();
  assert.deepEqual(
    [nextIn(card, 'hard'), nextIn(card, 'good'), nextIn(card, 'easy')],
    ['tomorrow', 'in 2 days', 'in 4 days']);
});

test('easy on a new word is four days, and the ease goes up', () => {
  reset();
  answer(card, 'easy');
  assert.deepEqual([p().iv, ease(), inDays()], [4, 2.15, 4]);
});

// Hard is not "show it again" - that is Again's job, and the two were one
// button until she said so.  She HAD the word, slowly: the wait grows by a
// fifth instead of by the ease, the ease comes down, and it does not come
// round again today.
test('hard: she had it slowly, so the wait grows a little and not again today', () => {
  reset();
  answer(card, 'good'); answer(card, 'good');     // 2 days, then 4
  assert.equal(answer(card, 'hard'), false);      // false: not again today
  assert.deepEqual([p().iv, ease(), inDays()], [5, 1.85, 5]);
  answer(card, 'hard');
  assert.deepEqual([p().iv, ease()], [6, 1.7]);   // and it climbs every time
});

test('hard on a word she has never answered is a day, and it counts as a rung', () => {
  reset();
  answer(card, 'hard');
  assert.deepEqual([p().iv, p().reps, p().total, inDays()], [1, 1, 1, 1]);
});

test('forgot it: back to the bottom, today, and the ease drops', () => {
  reset();
  answer(card, 'good');
  answer(card, 'good');
  assert.equal(answer(card, 'again'), true);      // true: it comes round again now
  assert.deepEqual([p().iv, p().reps, p().lapses, p().ease, inDays()], [0, 0, 1, 1.8, 0]);
});

test('what she has really recalled survives a slip; the rung does not', () => {
  reset();
  answer(card, 'good');
  answer(card, 'good');
  assert.deepEqual([p().reps, p().total], [2, 2]);
  answer(card, 'again');
  assert.deepEqual([p().reps, p().total], [0, 2]);
  answer(card, 'good');
  assert.deepEqual([p().reps, p().total], [1, 3]);
});

test('the ease has a floor: forgetting a word forever cannot pin it to zero', () => {
  reset();
  for (let i = 0; i < 20; i++) answer(card, 'again');
  assert.equal(p().ease, 1.3);
});

test('more often halves the wait, less often doubles it', () => {
  reset();
  answer(card, 'good'); answer(card, 'good'); answer(card, 'good');
  assert.equal(p().iv, 8);
  setPri(card.f, 1);
  assert.deepEqual([p().iv, inDays()], [8, 4]);   // the wait moves, what it earned does not
  setPri(card.f, -1);
  assert.deepEqual([p().iv, inDays()], [8, 16]);
  setPri(card.f, 0);
  assert.deepEqual([p().iv, inDays()], [8, 8]);
});

test('a priority on a word she has never answered moves nothing', () => {
  reset();
  setPri(card.f, 1);
  // She gets a record and the priority is on it, but there is no schedule to
  // move: the word has earned no interval and is still due the day it was made.
  assert.deepEqual([p().pri, p().iv, inDays()], [1, 0, 0]);
});

test('the button says what it will cost before she taps it', () => {
  reset();
  assert.equal(nextIn(card, 'good'), 'in 2 days');
  answer(card, 'good'); answer(card, 'good'); answer(card, 'good');
  assert.equal(nextIn(card, 'good'), 'in 16 days');   // 8 x 2.0
  progress[card.f].iv = 40;
  assert.equal(nextIn(card, 'good'), 'in 3 months');
});

test('and it says what Hard will cost, which is always less than Normal', () => {
  reset();
  assert.equal(nextIn(card, 'hard'), 'tomorrow');
  answer(card, 'good'); answer(card, 'good'); answer(card, 'good');
  assert.deepEqual([nextIn(card, 'hard'), nextIn(card, 'good'), nextIn(card, 'easy')],
    ['in 10 days', 'in 16 days', 'in 26 days']);
});

test('memorized: parked a month and a half by the schedule, or waved off by her', () => {
  reset();
  assert.equal(isMemorized(card), false);
  progress[card.f] = { iv: 44 };
  assert.equal(isMemorized(card), false);
  progress[card.f] = { iv: 45 };
  assert.equal(isMemorized(card), true);
  progress[card.f] = { iv: 0, known: 1 };
  assert.equal(isMemorized(card), true);
});
