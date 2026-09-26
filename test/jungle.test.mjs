// A run through her jungle: how many words it deals and what they are made of.
// She asked for a different number every time, which is exactly the kind of
// thing that is never the same twice on screen and so is never really checked.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { progress } from '../store.js';
import { jungleRun } from '../jungle.js';

const reset = () => { for (const k of Object.keys(progress)) delete progress[k]; };
const cards = (n, prefix = 'w') => Array.from({ length: n }, (_, i) => ({ f: prefix + i }));
const isNew = (c) => !progress[c.f];

test('a run is 15 to 30 words, and never the same card twice', () => {
  reset();
  for (let i = 0; i < 40; i++) {
    const run = jungleRun(cards(200));
    assert.ok(run.length >= 15 && run.length <= 30, `dealt ${run.length}`);
    assert.equal(new Set(run.map((c) => c.f)).size, run.length);
  }
});

test('a short library still gets a full run: all of it', () => {
  reset();
  const five = cards(5);
  const run = jungleRun(five);
  assert.equal(run.length, 5);
  assert.equal(new Set(run.map((c) => c.f)).size, 5);
});

test('nothing to deal deals nothing', () => {
  reset();
  assert.deepEqual(jungleRun([]), []);
});

test('mostly words she has never seen', () => {
  reset();
  const all = [...cards(100, 'new'), ...cards(100, 'old')];
  for (const c of all) if (c.f.startsWith('old')) progress[c.f] = { total: 3 };
  for (let i = 0; i < 20; i++) {
    const run = jungleRun(all);
    const fresh = run.filter(isNew).length;
    assert.ok(fresh / run.length >= 0.75, `only ${fresh} of ${run.length} were new`);
  }
});

test('the words she asked for more often get their share of every run', () => {
  reset();
  const all = [...cards(100, 'new'), ...cards(20, 'fav')];
  for (const c of all) if (c.f.startsWith('fav')) progress[c.f] = { pri: 1 };
  for (let i = 0; i < 20; i++) {
    const run = jungleRun(all);
    const fav = run.filter((c) => c.f.startsWith('fav')).length;
    // A share of the run, not a fixed quota: 15% of however many it dealt.
    assert.equal(fav, Math.round(run.length * 0.15));
  }
});

test('with only favourites to deal, the run is still a run', () => {
  reset();
  const all = cards(40, 'fav');
  for (const c of all) progress[c.f] = { pri: 1 };
  const run = jungleRun(all);
  assert.ok(run.length >= 15 && run.length <= 30, `dealt ${run.length}`);
  assert.equal(new Set(run.map((c) => c.f)).size, run.length);
});
