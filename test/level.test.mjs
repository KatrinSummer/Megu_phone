// How much of the village's language she has. The test at the end of a scene
// sets it and the story reads it, so a wrong threshold quietly opens or shuts
// quests - which looks like the story being odd, not like a bug.
import '../test-support/browser.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, levelOf, levelName, level, setLevel } from '../island/level.js';

test('three levels, in the order they are climbed', () => {
  assert.deepEqual(LEVELS.map(([id]) => id), ['none', 'half', 'most']);
});

test('a score is read as a share, so a longer test is not a harder one', () => {
  assert.equal(levelOf(9, 9), 'most');
  assert.equal(levelOf(3, 3), 'most');
  // Two thirds and one third exactly, asked twice over at two lengths: the same
  // share has to land on the same rung whether the scene carried nine words or
  // three, or a short scene would be a kinder judge than a long one.
  assert.equal(levelOf(6, 9), 'most');
  assert.equal(levelOf(2, 3), 'most');
  assert.equal(levelOf(3, 9), 'half');
  assert.equal(levelOf(1, 3), 'half');
  assert.equal(levelOf(2, 9), 'none');
});

test('the thresholds fall where they are written: two thirds and one third', () => {
  assert.equal(levelOf(67, 100), 'most');
  assert.equal(levelOf(66, 100), 'half');
  assert.equal(levelOf(34, 100), 'half');
  assert.equal(levelOf(33, 100), 'none');
});

test('a test she never sat says nothing about her, not nothing about anything', () => {
  assert.equal(levelOf(0, 0), 'none');
  assert.equal(levelOf(0, 9), 'none');
});

test('every level has a name, and an unknown one falls back to the bottom', () => {
  assert.equal(levelName('most'), 'Good');
  assert.equal(levelName('none'), 'Beginner');
  assert.equal(levelName('nonsense'), 'Beginner');
});

test('she can overrule it, because a test is one bad morning from being wrong', () => {
  assert.equal(level(), 'none');
  setLevel('most');
  assert.equal(level(), 'most');
  setLevel('half');
  assert.equal(level(), 'half');
});

test('a phone left on the four-rung ladder is not demoted by the rename', () => {
  // "some" was the second of four and is no longer a rung at all. Read as the
  // middle one: a phone that has not been opened since the change must not find
  // itself back at the bottom because a word on a chip changed.
  setLevel('some');
  assert.equal(level(), 'half');
});
