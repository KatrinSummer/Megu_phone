// Which words she is shown, and in what order.
import { progress, settings, today, fresh, saveProgress, started } from './store.js';

export const deck = { cards: [], decks: [] };
export const setDeck = (d) => Object.assign(deck, d);

// What the board holds, whether or not she has waved a word off.  The bars
// count against this, or marking a word known would shrink the goalpost too.
// There is no board of every word: she splits them into decks on purpose.
export const boardCards = (id) => id === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  : id === 'known' ? deck.cards.filter((c) => progress[c.f]?.known)
  // A word sits in its own deck and may also sit in a review deck like Last.
  : deck.cards.filter((c) => c.d === id || c.last === id);

// What she will actually be shown.  The Known board is the way back: open it
// and press the eye again to put a word back into rotation.
export const poolOf = (id) => id === 'known' ? boardCards(id)
  : boardCards(id).filter((c) => !progress[c.f]?.known);
export const pool = () => poolOf(settings.deck);

/** Never answered: a star or a priority set on a word does not start it. */
export const isNew = (c) => !started(progress[c.f]);
export const isDue = (c) => started(progress[c.f]) && progress[c.f].due <= today();

// One array for the life of the session, so everyone holds the same queue.
export const queue = [];
const refill = (list) => { queue.length = 0; queue.push(...list); };

const pri = (c) => progress[c.f]?.pri ?? 0;
/** "More often" first and "less often" last; within that the newest lesson
 *  first, so what she just learned is what she sees first. */
const byTurn = (a, b) => pri(b) - pri(a) || (b.when || '').localeCompare(a.when || '');
const shuffle = (list) => list.sort(() => Math.random() - 0.5);

/** The words she wants more often turn up in any board's round, at random, due
 *  or not and whether or not they belong to it - about one card in five. */
function withFavourites(list) {
  const here = new Set(list.map((c) => c.f));
  const extra = shuffle(deck.cards.filter((c) => pri(c) === 1 && !progress[c.f].known && !here.has(c.f)))
    .slice(0, Math.ceil(list.length / 5));
  for (const c of extra) list.splice(Math.floor(Math.random() * (list.length + 1)), 0, c);
  return list;
}

export function buildQueue() {
  const all = pool();
  // The Known board is not a lesson, it is the list she goes through to undo.
  if (settings.deck === 'known') return refill(all);
  const unseen = all.filter(isNew).sort(byTurn);
  refill(withFavourites([...shuffle(all.filter(isDue)), ...unseen.slice(0, settings.perDay)]));
}

/** She waved the word off, so it leaves whatever is left of today's round. */
export const dropFromQueue = (front) => refill(queue.filter((c) => c.f !== front));

/** The eye, or "I know it" on a word tapped in a sentence. Either way the word
 *  no longer belongs in what she is going through right now. */
export function flipKnown(front) {
  const p = progress[front] ??= fresh();
  p.known = p.known ? 0 : 1;
  p.seen = today();
  saveProgress();
  dropFromQueue(front);
  return p.known;
}

/** "Show more new words" on the done screen. */
export const moreNew = () =>
  refill(pool().filter(isNew).sort(byTurn).slice(0, settings.perDay));
