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

test('knew it: 2 days, then 4, then the interval times the ease', () => {
  reset();
  assert.equal(answer(card, 'good'), false);      // false: not again today
  assert.deepEqual([p().iv, p().reps, p().total, inDays()], [2, 1, 1, 2]);
  answer(card, 'good');
  assert.deepEqual([p().iv, inDays()], [4, 4]);
  answer(card, 'good');
  assert.deepEqual([p().iv, inDays()], [10, 10]);  // 4 x 2.5
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
  assert.deepEqual([p().iv, p().ease, inDays()], [4, 2.65, 4]);
});

// Hard is not "show it again" - that is Again's job, and the two were one
// button until she said so.  She HAD the word, slowly: the wait grows by a
// fifth instead of by the ease, the ease comes down, and it does not come
// round again today.
test('hard: she had it slowly, so the wait grows a little and not again today', () => {
  reset();
  answer(card, 'good'); answer(card, 'good');     // 2 days, then 4
  assert.equal(answer(card, 'hard'), false);      // false: not again today
  assert.deepEqual([p().iv, p().ease, inDays()], [5, 2.35, 5]);
  answer(card, 'hard');
  assert.deepEqual([p().iv, p().ease], [6, 2.2]); // and it climbs every time
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
  assert.deepEqual([p().iv, p().reps, p().lapses, p().ease, inDays()], [0, 0, 1, 2.3, 0]);
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
  assert.equal(p().iv, 10);
  setPri(card.f, 1);
  assert.deepEqual([p().iv, inDays()], [10, 5]);  // the wait moves, what it earned does not
  setPri(card.f, -1);
  assert.deepEqual([p().iv, inDays()], [10, 20]);
  setPri(card.f, 0);
  assert.deepEqual([p().iv, inDays()], [10, 10]);
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
  assert.equal(nextIn(card, 'good'), 'in 25 days');   // 10 x 2.5
  progress[card.f].iv = 40;
  assert.equal(nextIn(card, 'good'), 'in 3 months');
});

test('and it says what Hard will cost, which is always less than Normal', () => {
  reset();
  assert.equal(nextIn(card, 'hard'), 'tomorrow');
  answer(card, 'good'); answer(card, 'good'); answer(card, 'good');
  assert.deepEqual([nextIn(card, 'hard'), nextIn(card, 'good'), nextIn(card, 'easy')],
    ['in 12 days', 'in 25 days', 'in 1 months']);
});

test('memorized: parked a month by the schedule, or waved off by her', () => {
  reset();
  assert.equal(isMemorized(card), false);
  progress[card.f] = { iv: 29 };
  assert.equal(isMemorized(card), false);
  progress[card.f] = { iv: 30 };
  assert.equal(isMemorized(card), true);
  progress[card.f] = { iv: 0, known: 1 };
  assert.equal(isMemorized(card), true);
});
