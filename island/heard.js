// A line of theirs as she hears it.
//
// Kept apart from story.js: that file plays a scene - who is on screen, what
// the screen does, where the taps go - and this one is about one thing, what a
// word of the village sounds like to somebody who has not learned it yet.
import { esc } from '../core/dom.js';
import { cardOf } from '../study/boards.js';
import { isMemorized } from '../study/schedule.js';
import { stateOf } from '../study/word.js';

// The village speaks Japanese and she does not, so a word she has not learned
// reaches her as noise.  The noise is kana rather than invented symbols: she is
// hearing Japanese, she simply cannot understand it - and kana is certain to
// draw on her phone, which a rare glyph is not.
// Writing she cannot read, not a line struck out.  It was kana first, which read
// as Japanese she simply had not learned; then blocks, which read as a censored
// document rather than as a village speaking.  What she asked for is a script of
// their own - so this is one: letters, clearly letters, and not one of them hers.
// These are real Unicode syllabics rather than invented pictures because a made-
// up glyph has no font behind it and arrives on her phone as an empty box, which
// is unreadable for the wrong reason.  This block ships with iOS, Android and
// Windows alike.
const SCRIPT = 'ᐊᐃᐅᑎᑭᒥᓇᔭᕐᖏᐸᒐᓗᑦᔅ';
/** Same word in, same noise out - so an unheard word is recognisably the same
 *  one each time it comes round, and the day she learns it, it resolves. */
const deafen = (t) => [...t].map((ch, i) => (/[぀-ヿ]/.test(ch)
  ? SCRIPT[(ch.codePointAt(0) * 7 + i * 13) % SCRIPT.length] : ch)).join('');

/** A line is Japanese if there is kana in it; Megu's own English never is. */
export const JAPANESE = /[぀-ヿ]/;

/** Learned words stand as themselves and wear their colour; the rest is noise. */
const known = (t) => { const c = cardOf(t); return !!c && isMemorized(c); };

/** Every word of theirs the scene put in front of her, in the order it came.
 *  A test on a scene asks about these and nothing else: it is a test on the
 *  conversation she just had, not on the deck. */
const said = new Set();
export const clearHeard = () => said.clear();
export const heardWords = () => [...said];

/** A line as she hears it.  Scenes space their kana word by word, the same way
 *  her example sentences do, so each piece is one word to look up.  A word she
 *  has not learned carries both of its faces: the noise she hears, and what was
 *  really said underneath.  A tap turns the line over. */
export const heard = (text) => text.split(' ').map((t) => {
  if (cardOf(t)) said.add(t);
  return known(t)
    ? `<span class="w ${stateOf(cardOf(t))}">${esc(t)}</span>`
    : `<span class="noise" data-said="${esc(t)}" data-noise="${esc(deafen(t))}">${esc(deafen(t))}</span>`;
}).join(' ');
