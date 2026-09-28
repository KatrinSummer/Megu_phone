// A line of theirs on screen.
//
// It is plain Japanese, and that is her call. Their words used to arrive as
// noise until she had learned them, with a tap to turn the line over and see
// what was really said. She took both out: somebody who cannot read Japanese
// learns nothing from a scrambled version of it - it is unreadable either way
// - and the turning over was one more thing to press for no gain.
import { esc } from '../core/dom.js';
import { cardOf } from '../study/boards.js';
import { stateOf } from '../study/word.js';

/** A line is Japanese if there is kana in it; Megu's own English never is. */
export const JAPANESE = /[぀-ヿ]/;

/** Every word of theirs the scene put in front of her, in the order it came.
 *  A test on a scene asks about these and nothing else: it is a test on the
 *  conversation she just had, not on the deck. */
const said = new Set();
export const clearHeard = () => said.clear();
export const heardWords = () => [...said];

/** Scenes space their kana word by word, the same way her example sentences
 *  do, so each piece is one word to look at. A word that is in her deck wears
 *  the colour of how well she knows it; the rest stands plain. */
export const heard = (text) => text.split(' ').map((t) => {
  const c = cardOf(t);
  if (!c) return esc(t);
  said.add(t);
  return `<span class="w ${stateOf(c)}">${esc(t)}</span>`;
}).join(' ');
