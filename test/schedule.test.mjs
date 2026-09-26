// When a word comes back. This is the one piece of the app that decides what
// she studies tomorrow, and it is arithmetic with no screen in it, so it can be
// checked here in a second rather than by driving a browser for two minutes.
//
// A list of checks read top to bottom; it is a test, so it may grow.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { progress, today } from '../store.js';
import { answer, nextIn, setPri, isMemorized } from '../schedule.js';

const card = { f: 'ねこ' };
const reset = () => { for (const k of Object.keys(progress)) delete progress[k]; };
const p = () => progress[card.f];
const inDays = () => p().due - today();

test('knew it: 1 day, then 3, then the interval times the ease', () => {
  reset();
  assert.equal(answer(card, 'good'), false);      // false: not again today
  assert.deepEqual([p().iv, p().reps, p().total, inDays()], [1, 1, 1, 1]);
  answer(card, 'good');
  assert.deepEqual([p().iv, inDays()], [3, 3]);
  answer(card, 'good');
  assert.deepEqual([p().iv, inDays()], [8, 8]);   // 3 x 2.5, rounded
});

test('easy adds half again, and never less than two days', () => {
  reset();
  answer(card, 'easy');
  // The first step is one day; half again would be 1.5, and a day and a half is
  // not a day she can be shown a word on.
  assert.deepEqual([p().iv, p().ease, inDays()], [2, 2.65, 2]);
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
  assert.equal(nextIn(card, 'good'), 'tomorrow');
  answer(card, 'good'); answer(card, 'good'); answer(card, 'good');
  assert.equal(nextIn(card, 'good'), 'in 20 days');   // 8 x 2.5
  progress[card.f].iv = 40;
  assert.equal(nextIn(card, 'good'), 'in 3 months');
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
