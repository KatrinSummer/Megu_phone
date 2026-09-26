// Which words she is shown, and in what order. The biggest piece of logic in
// the phone with no screen in it: every board is a filter over the same deck,
// and a word in the wrong board is a word she never meets or one she meets
// twice.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { progress, settings, today } from '../store.js';
import { queue } from '../lesson.js';
import {
  setDeck, deck, cardOf, boardCards, isOut, isOutBoard, noLesson, poolOf,
  isNew, isDue, learnable, reviewable, buildQueue, flipMark, putBack,
} from '../boards.js';

// Two ordinary decks, and one word that also sits in the review deck.
const cards = [
  { f: 'a', d: 'ess' }, { f: 'b', d: 'ess' }, { f: 'c', d: 'ess', last: 'last' },
  { f: 'd', d: 'use' }, { f: 'e', d: 'use' },
];
const fronts = (list) => list.map((c) => c.f).sort();

const reset = () => {
  for (const k of Object.keys(progress)) delete progress[k];
  setDeck({ cards, decks: [] });
  settings.deck = 'ess';
  settings.mode = 'learn';
  settings.perDay = 20;
  settings.rand = false;
};

test('a board is its own deck, plus anything the review deck borrowed', () => {
  reset();
  assert.deepEqual(fronts(boardCards('ess')), ['a', 'b', 'c']);
  assert.deepEqual(fronts(boardCards('use')), ['d', 'e']);
  assert.deepEqual(fronts(boardCards('last')), ['c']);
});

test('her made-up boards are filters, not decks', () => {
  reset();
  progress.a = { star: 1 };
  progress.b = { total: 1 };
  progress.d = { hide: 1 };
  progress.e = { known: 1 };
  assert.deepEqual(fronts(boardCards('star')), ['a']);
  assert.deepEqual(fronts(boardCards('hidden')), ['d']);
  assert.deepEqual(fronts(boardCards('learning')), ['b']);
  // Learned holds the ticked ones AND the ones she has merely started, because
  // Home counts both and two places must not give two answers.
  assert.deepEqual(fronts(boardCards('known')), ['b', 'e']);
});

test('Priorities holds every word, and hands out a copy of the list', () => {
  reset();
  assert.deepEqual(fronts(boardCards('pri')), ['a', 'b', 'c', 'd', 'e']);
  // A caller that sorts what it was handed must not scramble the library.
  assert.notEqual(boardCards('pri'), deck.cards);
  boardCards('pri').reverse();
  assert.deepEqual(deck.cards.map((c) => c.f), ['a', 'b', 'c', 'd', 'e']);
});

test('a word she ticked or hid is out of the round, but not off its own board', () => {
  reset();
  progress.a = { known: 1 };
  progress.b = { hide: 1 };
  assert.equal(isOut(cardOf('a')), true);
  assert.equal(isOut(cardOf('b')), true);
  assert.equal(isOut(cardOf('c')), false);
  // The board still counts them - marking a word known must not shrink the
  // goalpost - but the lesson does not deal them.
  assert.deepEqual(fronts(boardCards('ess')), ['a', 'b', 'c']);
  assert.deepEqual(fronts(poolOf('ess')), ['c']);
});

test('the two boards that exist to undo a mark keep the marked words', () => {
  reset();
  progress.a = { known: 1 };
  progress.b = { hide: 1 };
  assert.equal(isOutBoard('known'), true);
  assert.equal(isOutBoard('hidden'), true);
  assert.equal(isOutBoard('ess'), false);
  assert.deepEqual(fronts(poolOf('hidden')), ['b']);
  // ...and they deal no lesson, nor does Priorities.
  assert.deepEqual(['known', 'hidden', 'pri', 'ess'].map(noLesson), [true, true, true, false]);
});

test('new, due, and the two buttons a board offers', () => {
  reset();
  progress.a = { total: 1, due: today() - 1 };     // started, and its day has come
  progress.b = { total: 1, due: today() + 5 };     // started, not yet
  assert.equal(isNew(cardOf('a')), false);
  assert.equal(isNew(cardOf('c')), true);
  assert.equal(isDue(cardOf('a')), true);
  assert.equal(isDue(cardOf('b')), false);
  assert.equal(isDue(cardOf('c')), false);         // never answered is not overdue
  assert.deepEqual(fronts(learnable('ess')), ['c']);
  assert.deepEqual(fronts(reviewable('ess')), ['a', 'b']);
});

test('a review deals the words whose day came first, and never more than asked', () => {
  reset();
  settings.mode = 'review';
  settings.perDay = 2;
  progress.a = { total: 1, due: today() - 5 };
  progress.b = { total: 1, due: today() - 1 };
  progress.c = { total: 1, due: today() + 9 };
  buildQueue();
  assert.equal(queue.length, 2);
  assert.equal(queue[0].f, 'a');                   // the longest overdue goes first
});

test('a lesson is never all repeats: some new words, always', () => {
  reset();
  settings.perDay = 10;
  for (const f of ['a', 'b']) progress[f] = { total: 1, due: today() - 1 };
  buildQueue();
  assert.ok(queue.length > 0 && queue.length <= 10);
  assert.ok(queue.some((c) => isNew(c)), 'a lesson opened as a wall of repeats');
});

test('the jungle belongs to no board and skips what she waved off', () => {
  reset();
  settings.mode = 'jungle';
  progress.a = { hide: 1 };
  buildQueue();
  assert.ok(queue.length > 0 && queue.length <= 4);   // only four left in the round
  assert.ok(!queue.some((c) => c.f === 'a'));
});

test('the tick and the eye each clear the other', () => {
  reset();
  assert.equal(flipMark('a', 'known'), 1);
  // Cleared, not merely absent: the other mark is written down as off, so a
  // word carrying both from some older save cannot keep the one she just undid.
  assert.equal(progress.a.hide, 0);
  assert.equal(flipMark('a', 'hide'), 1);
  assert.equal(progress.a.known, 0);               // the eye took the tick off
  assert.equal(flipMark('a', 'hide'), 0);          // pressed again, it is off
});

test('putting a word back: her tick comes off, the schedule lets it go today', () => {
  reset();
  progress.a = { known: 1, total: 3 };
  putBack('a');
  assert.equal(progress.a.known, 0);

  // Nothing to un-tick here: what holds this one out is the month the schedule
  // gave it, so the wait goes and everything it earned stays.
  progress.b = { total: 7, ease: 2.9, iv: 40, due: today() + 40 };
  putBack('b');
  assert.deepEqual([progress.b.iv, progress.b.due - today(), progress.b.total, progress.b.ease],
    [0, 0, 7, 2.9]);
});
