// Which words she is shown, and in what order.
import { progress, settings, today } from './store.js';

export const deck = { cards: [], decks: [] };
export const setDeck = (d) => Object.assign(deck, d);

// What the board holds, whether or not she has waved a word off.  The bars
// count against this, or marking a word known would shrink the goalpost too.
export const boardCards = (id) => id === 'all' ? deck.cards
  : id === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  : id === 'new' ? newestLesson()
  : id === 'known' ? deck.cards.filter((c) => progress[c.f]?.known)
  // A word sits in its own deck and may also sit in a review deck like Last.
  : deck.cards.filter((c) => c.d === id || c.last === id);

/** The words from the most recent lesson.  Only real dates count: the library
 *  marks older imports "Legacy / undated", and that sorts above any of them. */
export const newestLesson = () => {
  const day = deck.cards.reduce((m, c) => (/^\d{8}$/.test(c.when) && c.when > m ? c.when : m), '');
  return day ? deck.cards.filter((c) => c.when === day) : [];
};

// What she will actually be shown.  The Known board is the way back: open it
// and press the eye again to put a word back into rotation.
export const poolOf = (id) => id === 'known' ? boardCards(id)
  : boardCards(id).filter((c) => !progress[c.f]?.known);
export const pool = () => poolOf(settings.deck);

// One array for the life of the session, so everyone holds the same queue.
export const queue = [];
const refill = (list) => { queue.length = 0; queue.push(...list); };

/** Newest lesson first, so what she just learned is what she sees first. */
const byNewest = (a, b) => (b.when || '').localeCompare(a.when || '');

export function buildQueue() {
  const t = today(), all = pool();
  // The Known board is not a lesson, it is the list she goes through to undo.
  if (settings.deck === 'known') return refill(all);
  const due = all.filter((c) => progress[c.f] && progress[c.f].due <= t);
  const unseen = all.filter((c) => !progress[c.f]).sort(byNewest);
  refill([...due.sort(() => Math.random() - 0.5), ...unseen.slice(0, settings.perDay)]);
}

/** She waved the word off, so it leaves whatever is left of today's round. */
export const dropFromQueue = (front) => refill(queue.filter((c) => c.f !== front));

/** "Show more new words" on the done screen. */
export const moreNew = () =>
  refill(pool().filter((c) => !progress[c.f]).sort(byNewest).slice(0, settings.perDay));
