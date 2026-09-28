// How much of the village's language she has.
//
// The test at the end of a scene sets it, and the story reads it: a good level
// opens many quests, a poor one few.  She can overrule it in Settings, because
// a test is one bad morning away from being wrong about her, and being told by
// an app that you know nothing is not a thing to be stuck with.
import { settings, saveSettings } from '../core/store.js';

// Three, in the order they are climbed, and they are the concept's own words.
// There used to be four, named as sentences about her rather than grades - "a
// few words" is where she is, "Beginner" is a label on a person - but the three
// she wrote are the three the story asks her for, and the story is hers.  The
// id is what is saved and never shown, so the wording can change again without
// touching a single record.
export const LEVELS = [
  ['none', 'Beginner'],
  ['half', 'Normal'],
  ['most', 'Good'],
];

/** What a test score means. Judged as a share, so the ladder survives a test
 *  that asks a different number of questions - a third of it and two thirds of
 *  it, now that there are three rungs rather than four. */
export const levelOf = (right, of) => {
  const s = of ? right / of : 0;
  return s >= 2 / 3 ? 'most' : s >= 1 / 3 ? 'half' : 'none';
};

export const levelName = (id) => (LEVELS.find(([k]) => k === id) ?? LEVELS[0])[1];

/** A phone that was on the four-rung ladder has "some" saved on it, which is no
 *  longer a rung: it reads as the middle one rather than as nothing, so nobody
 *  is quietly demoted by a rename. */
export const level = () => {
  const id = settings.level ?? 'none';
  return LEVELS.some(([k]) => k === id) ? id : 'half';
};

export const setLevel = (id) => { settings.level = id; saveSettings(); };
