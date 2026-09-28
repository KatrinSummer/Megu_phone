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
// reaches her as noise.  The noise is KANA, because she asked for kana twice.
// A "script of their own" was my idea and it was the wrong one: a row of
// Canadian syllabics is not a language she is failing to understand, it is
// gibberish on her screen, and she said so. She is hearing Japanese and simply
// cannot follow it, so that is what it has to look like.
//
// Hiragana stays hiragana and katakana stays katakana - a katakana word turned
// into hiragana would be the wrong kind of Japanese, and she can tell.  The
// long mark and everything else is left alone: it is punctuation, not a sound
// she could have learned.
const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const KATA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const swap = (set, ch, i) => set[(ch.codePointAt(0) * 7 + i * 13) % set.length];
/** Same word in, same noise out - so an unheard word is recognisably the same
 *  one each time it comes round, and the day she learns it, it resolves. */
const deafen = (t) => [...t].map((ch, i) => (/[ぁ-ん]/.test(ch) ? swap(HIRA, ch, i)
  : /[ァ-ヴ]/.test(ch) ? swap(KATA, ch, i) : ch)).join('');

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
