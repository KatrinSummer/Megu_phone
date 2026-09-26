// The test at the end of a scene: how much of their language does she have?
//
// Ten questions, and they get harder as they go - three she should manage, three
// that ask the same thing backwards, three where she has to hold a whole
// sentence, and a last one that is meant to be beyond her.  Every question is
// Megu trying to speak or trying to follow, because that is what is happening
// to her; none of it is a vocabulary drill with a costume on.
//
// It asks about the words that were actually spoken in the scene first, then
// fills up from the deck - a scene says three words and the test is ten long.
// How it went is written down, because the story is meant to read it: a good
// score opens many quests, a poor one few.
import { $, esc } from './dom.js';
import { deck, cardOf } from './boards.js';
import { settings, saveSettings } from './store.js';
import { levelOf, levelName, setLevel } from './level.js';

const shuffle = (list) => list.sort(() => Math.random() - 0.5);

/** Answers that could pass for the right one: the same sort of length, where
 *  the deck allows it, or the right answer is the odd one out and she can pick
 *  it without reading a word. `key` is the side being answered in. */
function decoys(card, n, key) {
  const len = [...card[key]].length;
  const others = deck.cards.filter((c) => c.f !== card.f && c.e !== card.e);
  const near = others.filter((c) => Math.abs([...c[key]].length - len) <= 2);
  return shuffle([...(near.length >= n ? near : others)]).slice(0, n);
}

const answers = (card, n, key) =>
  shuffle([card, ...decoys(card, n, key)]).map((c) => c[key]);

/** She has something to say and has to find it. */
const toSay = (c) => ({
  q: `You want to say <b>${esc(c.e)}</b>. How does it go?`,
  opts: answers(c, 2, 'f'), right: c.f,
});

/** The other way round, which is the harder one: she is not choosing what to
 *  say, she is catching what was said to her. */
const toHear = (c) => ({
  q: `He said <b>${esc(c.f)}</b>. What was that?`,
  opts: answers(c, 3, 'e'), right: c.e,
});

/** A whole sentence with the word taken out of it.  Her own example sentences,
 *  in the kana she reads, spaced word by word the way the rest of the app
 *  spaces them - so the question is whether she can hold the sentence, not
 *  whether she can find a word in a list. */
const WORD = 8;                           // kana; past this it is a phrase, not a word
const isWord = (c) => [...c.f].length <= WORD;

function toSpeak(c, n) {
  // A word missing out of a sentence, not a sentence missing out of a sentence.
  // A fair share of the deck is whole phrases, and one of those in the hole
  // turns the question into five unrelated sentences to choose between - which
  // is not the sentence being read at all.
  if (!isWord(c)) return null;
  const ex = (c.x ?? []).find((x) => x.k?.split(' ').includes(c.f));
  if (!ex) return null;
  const hole = ex.k.split(' ').map((w) => (w === c.f ? '＿＿＿' : w)).join(' ');
  return {
    q: `You are trying to say this. One word is missing:<br><span class="cloze">${esc(hole)}</span>`,
    opts: answers(c, n, 'f'), right: c.f,
  };
}

/** The ten, in the order she meets them.  Cards come from the scene first and
 *  then from the deck; a card with no usable sentence simply is not asked a
 *  sentence question, and the next one is tried. */
function build(words) {
  const seen = new Set(words);
  const pool = [...shuffle([...seen].map(cardOf).filter(Boolean)),
                ...shuffle(deck.cards.filter((c) => !seen.has(c.f)))];
  const qs = [];
  let at = 0;
  const next = () => pool[at++];
  const add = (make) => { const c = next(); if (c) { const q = make(c); if (q) qs.push(q); } };

  for (let i = 0; i < 3; i++) add(toSay);
  for (let i = 0; i < 3; i++) add(toHear);
  // Three with a sentence in them, and one last one that is meant to be beyond
  // her: five answers instead of four, and the longest sentence the pool has.
  for (let i = 0; i < 3 && at < pool.length; i++) {
    const before = qs.length;
    while (qs.length === before && at < pool.length) add((c) => toSpeak(c, 3));
  }
  // The longest sentence left - but only among cards a hole can be cut in, and
  // walking down the list rather than betting the last question on the very
  // first candidate.  Asking for "the longest" without that rule cost the tenth
  // question outright: the longest sentences belong to the phrase cards, which
  // are exactly the ones a hole cannot be cut in.
  const longest = pool.slice(at).filter(isWord)
    .map((c) => [c, (c.x ?? []).reduce((n, x) =>
      Math.max(n, x.k?.split(' ').includes(c.f) ? x.k.length : 0), 0)])
    .filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  for (const [c] of longest) { const q = toSpeak(c, 4); if (q) { qs.push(q); break; } }
  return qs;
}

/**
 * `box` is the speech plate, `name` the scene it belongs to, `words` the
 * Japanese said in it, `done` what happens once she has finished - the scene's
 * own ending.
 * With nothing to ask about, there is no test: an empty one would be a screen
 * she has to tap past for no reason.
 */
export function startQuiz(box, name, words, done) {
  const qs = build(words);
  if (!qs.length) return done();

  let at = 0, right = 0, pick = null;

  const draw = () => {
    const q = qs[at];
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q">${q.q}</p>
      <div class="quiz">${q.opts.map((o) => {
        const state = !pick ? '' : o === q.right ? ' right' : o === pick ? ' wrong' : ' dim';
        return `<button class="quiz-a${state}">${esc(o)}</button>`;
      }).join('')}</div>
      <p class="on">${pick ? 'tap to go on' : `${at + 1} of ${qs.length}`}</p>`;
    for (const b of box.querySelectorAll('.quiz-a')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();                  // the screen is a way on; this is not
        if (pick) return next();
        pick = b.textContent;
        if (pick === q.right) right++;
        draw();
      });
    }
    // Once she has answered, the whole plate is the way on, the same as the rest
    // of the story - she should not have to find the small print.
    if (pick) box.addEventListener('click', next, { once: true });
  };

  const next = () => {
    at++;
    pick = null;
    if (at < qs.length) return draw();
    // Written down where the story can read it later: which scene, how it went,
    // and what it makes of her.  The level is hers to change afterwards.
    (settings.scenes ??= {})[name] = { right, of: qs.length };
    saveSettings();
    const id = levelOf(right, qs.length);
    setLevel(id);
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q"><b>${right} of ${qs.length}</b></p>
      <p>${esc(levelName(id))}.</p>
      <p class="on">You can change this in Settings · tap to go on</p>`;
    box.addEventListener('click', done, { once: true });
  };

  draw();
}
