// The lesson she is in: what is left to go, what comes round once more at the
// end, and where a reload finds her. The phone closes the app behind her back
// and a new version reloads it, so "she is put back on the card she was on" is
// not a nicety - it is the difference between a lesson and a lost lesson.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { today, saveLesson } from '../store.js';
import {
  queue, again, first, lesson, startLesson, nextCard, drop, keep, forget, resume,
} from '../lesson.js';

const deck = [{ f: 'a' }, { f: 'b' }, { f: 'c' }];
const cardOf = (f) => deck.find((c) => c.f === f);
const fronts = (list) => list.map((c) => c.f);

test('a new list is a new lesson: nothing of the last one is left', () => {
  startLesson(deck);
  again.push({ f: 'x' });
  first.set('a', 'again');
  lesson.repeating = true;

  startLesson([{ f: 'z' }]);
  assert.deepEqual(fronts(queue), ['z']);
  assert.equal(again.length, 0);
  assert.equal(first.size, 0);
  assert.equal(lesson.repeating, false);
});

test('the cards come in the order they were dealt, then there are none', () => {
  startLesson(deck);
  assert.deepEqual([nextCard().f, nextCard().f, nextCard().f], ['a', 'b', 'c']);
  assert.equal(nextCard(), null);
});

test('what she missed comes round after the last card, not back into the middle', () => {
  startLesson([{ f: 'a' }, { f: 'b' }]);
  const missed = nextCard();          // a
  again.push(missed);
  assert.equal(lesson.repeating, false);
  assert.equal(nextCard().f, 'b');    // the lesson finishes first
  assert.equal(nextCard().f, 'a');    // and only then what she missed
  assert.equal(lesson.repeating, true);
  assert.equal(nextCard(), null);
});

test('a word she waves off leaves the lesson, the end of it included', () => {
  startLesson(deck);
  again.push({ f: 'c' });
  drop('c');
  assert.deepEqual(fronts(queue), ['a', 'b']);
  assert.equal(again.length, 0);
});

test('a reload puts her back on the card she was on, with the same count', () => {
  startLesson(deck);
  const current = nextCard();         // a; b and c still to go
  first.set('a', 'good');
  keep('last', current);

  startLesson([]);                    // the app restarting
  assert.equal(resume(cardOf), 'last');
  assert.equal(nextCard().f, 'a');    // the card she was looking at, not the next one
  assert.deepEqual(fronts(queue), ['b', 'c']);
  assert.equal(first.get('a'), 'good');
});

test('what she missed survives the reload too', () => {
  startLesson(deck);
  const current = nextCard();
  again.push(cardOf('c'));
  keep('last', current);

  startLesson([]);
  resume(cardOf);
  assert.deepEqual(fronts(again), ['c']);
});

test("yesterday's lesson is not today's", () => {
  saveLesson({ day: today() - 1, deck: 'last', cards: ['a'], again: [], repeating: false, first: [] });
  assert.equal(resume(cardOf), null);
});

test('a lesson whose words are gone is no lesson at all', () => {
  // She deleted them on the computer between one session and the next.
  saveLesson({ day: today(), deck: 'last', cards: ['gone'], again: [], repeating: false, first: [] });
  assert.equal(resume(() => undefined), null);
  assert.equal(queue.length, 0);
});

test('finishing forgets where she was', () => {
  startLesson(deck);
  keep('last', nextCard());
  forget();
  assert.equal(resume(cardOf), null);
});
