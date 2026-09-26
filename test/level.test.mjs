// How much of the village's language she has. The test at the end of a scene
// sets it and the story reads it, so a wrong threshold quietly opens or shuts
// quests - which looks like the story being odd, not like a bug.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, levelOf, levelName, level, setLevel } from '../level.js';

test('four levels, in the order they are climbed', () => {
  assert.deepEqual(LEVELS.map(([id]) => id), ['none', 'some', 'half', 'most']);
});

test('a score is read as a share, so a longer test is not a harder one', () => {
  assert.equal(levelOf(9, 9), 'most');
  assert.equal(levelOf(3, 3), 'most');
  assert.equal(levelOf(6, 9), 'half');
  assert.equal(levelOf(2, 3), 'half');
  assert.equal(levelOf(3, 9), 'some');
  assert.equal(levelOf(2, 9), 'none');
});

test('the thresholds fall where they are written: .9, .6, .3', () => {
  assert.equal(levelOf(90, 100), 'most');
  assert.equal(levelOf(89, 100), 'half');
  assert.equal(levelOf(60, 100), 'half');
  assert.equal(levelOf(59, 100), 'some');
  assert.equal(levelOf(30, 100), 'some');
  assert.equal(levelOf(29, 100), 'none');
});

test('a test she never sat says nothing about her, not nothing about anything', () => {
  assert.equal(levelOf(0, 0), 'none');
  assert.equal(levelOf(0, 9), 'none');
});

test('every level has a name, and an unknown one falls back to the bottom', () => {
  assert.equal(levelName('most'), 'Most of it');
  assert.equal(levelName('none'), 'Not a word');
  assert.equal(levelName('nonsense'), 'Not a word');
});

test('she can overrule it, because a test is one bad morning from being wrong', () => {
  assert.equal(level(), 'none');
  setLevel('most');
  assert.equal(level(), 'most');
  setLevel('some');
  assert.equal(level(), 'some');
});
