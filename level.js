// How much of the village's language she has.
//
// The test at the end of a scene sets it, and the story reads it: a good level
// opens many quests, a poor one few.  She can overrule it in Settings, because
// a test is one bad morning away from being wrong about her, and being told by
// an app that you know nothing is not a thing to be stuck with.
import { settings, saveSettings } from './store.js';

// Four, in the order they are climbed.  The id is what is saved; the name is
// what she reads, and it is written as a sentence about her rather than as a
// grade - "Beginner" is a label on a person, "a few words" is where she is.
// Short enough to stand in a row of four on a phone: this list is also the
// switch in Settings, and a sentence-long name there wraps into a wall.
export const LEVELS = [
  ['none', 'Not a word'],
  ['some', 'A few words'],
  ['half', 'Getting by'],
  ['most', 'Most of it'],
];

/** What a test score means. Judged as a share, so the ladder survives a test
 *  that asks a different number of questions. */
export const levelOf = (right, of) => {
  const s = of ? right / of : 0;
  return s >= 0.9 ? 'most' : s >= 0.6 ? 'half' : s >= 0.3 ? 'some' : 'none';
};

export const levelName = (id) => (LEVELS.find(([k]) => k === id) ?? LEVELS[0])[1];

export const level = () => settings.level ?? 'none';

export const setLevel = (id) => { settings.level = id; saveSettings(); };
