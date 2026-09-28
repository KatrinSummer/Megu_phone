// The four piles her ring is drawn from. Every board wears one and Home wears
// the big one, so a word counted in the wrong pile is wrong everywhere at once
// - and the ring is a picture, which is the hardest place to notice it.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { progress } from '../core/store.js';
import { shares } from '../boards/ring.js';
// The wait at which a word counts as learned, taken from the schedule rather
// than written down again here: it moved from 30 days to 45 and this file was
// the only thing that disagreed.
import { MEMORIZED } from '../study/schedule.js';

const reset = () => { for (const k of Object.keys(progress)) delete progress[k]; };
const cards = (...fronts) => fronts.map((f) => ({ f }));

test('a word she has never answered is not started', () => {
  reset();
  assert.deepEqual(shares(cards('a')), { know: 0, learn: 0, fresh: 1, hid: 0 });
});

test('one answer puts it in the middle pile', () => {
  reset();
  progress.a = { total: 1 };
  assert.deepEqual(shares(cards('a')), { know: 0, learn: 1, fresh: 0, hid: 0 });
});

test('a slip is a start too: she has met the word', () => {
  reset();
  progress.a = { lapses: 1 };
  assert.deepEqual(shares(cards('a')), { know: 0, learn: 1, fresh: 0, hid: 0 });
});

test('parked long enough by the schedule counts as known, and so does her tick', () => {
  reset();
  progress.a = { iv: MEMORIZED };
  progress.b = { known: 1 };
  progress.c = { iv: MEMORIZED - 1, total: 1 };
  assert.deepEqual(shares(cards('a', 'b', 'c')), { know: 2, learn: 1, fresh: 0, hid: 0 });
});

test('a word she waved off is in its own pile and in no other', () => {
  reset();
  progress.a = { hide: 1 };
  progress.b = { hide: 1, known: 1, iv: 40 };   // hidden wins: it is not on the board
  assert.deepEqual(shares(cards('a', 'b')), { know: 0, learn: 0, fresh: 0, hid: 2 });
});

test('the four piles always add up to the board', () => {
  reset();
  progress.b = { total: 1 };
  progress.c = { iv: MEMORIZED };
  progress.d = { hide: 1 };
  const all = cards('a', 'b', 'c', 'd', 'e');
  const s = shares(all);
  assert.equal(s.know + s.learn + s.fresh + s.hid, all.length);
  assert.deepEqual(s, { know: 1, learn: 1, fresh: 2, hid: 1 });
});

test('an empty board draws an empty ring rather than dividing by nothing', () => {
  reset();
  assert.deepEqual(shares([]), { know: 0, learn: 0, fresh: 0, hid: 0 });
});
