// The test at the end of a scene: did she catch any of what was said to her?
//
// It asks about the words that were actually spoken in the scene just played -
// not about the deck - so it is the conversation being tested and not her
// revision. How it went is written down, because the story is meant to read it:
// a good score opens many quests, a poor one few.
import { $, esc } from './dom.js';
import { deck, cardOf } from './boards.js';
import { settings, saveSettings } from './store.js';

const MOST = 5;

/** Three answers to choose between: the right one and two that could pass for
 *  it. Same length where the deck allows, or the right answer is the odd one
 *  out and she can pick it without reading a word. */
function options(card) {
  const n = [...card.f].length;
  const others = deck.cards.filter((c) => c.f !== card.f && c.e !== card.e);
  const near = others.filter((c) => Math.abs([...c.f].length - n) <= 1);
  const pool = near.length >= 2 ? near : others;
  const pick = [];
  while (pick.length < 2 && pool.length) {
    pick.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return [card, ...pick].sort(() => Math.random() - 0.5);
}

const shuffle = (list) => list.sort(() => Math.random() - 0.5);

/** How it reads back to her, and what the story will make of it. */
function verdict(right, of) {
  if (right === of) return 'Not a word of it was lost.';
  if (right * 2 >= of) return 'Some of it came through.';
  if (right) return 'Almost none of it came through.';
  return 'None of it came through - not one word.';
}

/**
 * `box` is the speech plate, `name` the scene it belongs to, `words` the
 * Japanese said in it, `done` what happens once she has finished - the scene's
 * own ending.
 * With nothing to ask about, there is no test: an empty one would be a screen
 * she has to tap past for no reason.
 */
export function startQuiz(box, name, words, done) {
  const cards = shuffle([...new Set(words)].map(cardOf).filter(Boolean)).slice(0, MOST);
  if (!cards.length) return done();

  let at = 0, right = 0, answered = null;

  const draw = () => {
    const c = cards[at];
    const opts = answered?.opts ?? options(c);
    if (!answered) answered = { opts, pick: null };
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q">What does <b>${esc(c.e)}</b> sound like?</p>
      <div class="quiz">${opts.map((o) => {
        const state = !answered.pick ? '' : o.f === c.f ? ' right' : o.f === answered.pick ? ' wrong' : ' dim';
        return `<button class="quiz-a${state}" data-f="${esc(o.f)}">${esc(o.f)}</button>`;
      }).join('')}</div>
      <p class="on">${answered.pick ? 'tap to go on' : `${at + 1} of ${cards.length}`}</p>`;
    for (const b of box.querySelectorAll('.quiz-a')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();                  // the screen is a way on; this is not
        if (answered.pick) return next();
        answered.pick = b.dataset.f;
        if (answered.pick === c.f) right++;
        draw();
      });
    }
    // Once she has answered, the whole plate is the way on, the same as the rest
    // of the story - she should not have to find the small print.
    if (answered.pick) box.addEventListener('click', next, { once: true });
  };

  const next = () => {
    at++;
    answered = null;
    if (at < cards.length) return draw();
    // Written down where the story can read it later: which scene, and how it went.
    (settings.scenes ??= {})[name] = { right, of: cards.length };
    saveSettings();
    box.innerHTML = `<p class="who">A test</p>
      <p class="quiz-q"><b>${right} of ${cards.length}</b></p>
      <p>${verdict(right, cards.length)}</p>
      <p class="on">tap to go on</p>`;
    box.addEventListener('click', done, { once: true });
  };

  draw();
}
