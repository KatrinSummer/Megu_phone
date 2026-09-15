// Which words she is shown, and in what order.
import { progress, settings, today, fresh, saveProgress, started } from './store.js';
import { startLesson, drop } from './lesson.js';

export const deck = { cards: [], decks: [] };
export const setDeck = (d) => Object.assign(deck, d);
// The deck arrives once, before the first card is drawn.
let byFront = null;
export const cardOf = (f) => (byFront ??= new Map(deck.cards.map((c) => [c.f, c]))).get(f);

// What the board holds, whether or not she has waved a word off.  The bars
// count against this, or marking a word known would shrink the goalpost too.
// There is no board of every word: she splits them into decks on purpose.
export const boardCards = (id) => id === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  : id === 'known' ? deck.cards.filter((c) => progress[c.f]?.known)
  // Review: every word she has started, from every deck.
  : id === 'learning' ? deck.cards.filter((c) => started(progress[c.f]))
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

// Every new list of cards is a new lesson.
const refill = startLesson;

const pri = (c) => progress[c.f]?.pri ?? 0;
/** "More often" first and "less often" last; within that the newest lesson
 *  first, so what she just learned is what she sees first. */
const byTurn = (a, b) => pri(b) - pri(a) || (b.when || '').localeCompare(a.when || '');
const shuffle = (list) => list.sort(() => Math.random() - 0.5);

/** The words she wants more often turn up in every review, at random, due or
 *  not and whether or not they belong to it - about one card in five. */
function withFavourites(list) {
  const here = new Set(list.map((c) => c.f));
  const extra = shuffle(deck.cards.filter((c) => pri(c) === 1 && !progress[c.f].known && !here.has(c.f)))
    .slice(0, Math.ceil(list.length / 5));
  for (const c of extra) list.splice(Math.floor(Math.random() * (list.length + 1)), 0, c);
  return list;
}

/** The boards she goes through to repeat what she has started, not to learn. */
export const isReview = (id) => id === 'learning' || id === 'star';

/** The word whose day came first goes first; one already done today goes last,
 *  so "review more" moves on instead of starting over with what she just saw. */
const byDue = (a, b) => {
  const p = progress[a.f], q = progress[b.f];
  return (p?.seen === today()) - (q?.seen === today()) || (p?.due ?? 0) - (q?.due ?? 0);
};

export function buildQueue() {
  const all = pool(), n = settings.perDay;
  // The Known board is not a lesson, it is the list she goes through to undo.
  if (settings.deck === 'known') return refill(all);
  // A review: n of her words, whether their day has come or not.
  if (isReview(settings.deck)) return refill(withFavourites(all.sort(byDue).slice(0, n)).slice(0, n));
  // A lesson is for learning: new words only. What she has started comes back in Review.
  refill(all.filter(isNew).sort(byTurn).slice(0, n));
}

/** The eye, or "I know it" on a word tapped in a sentence. Either way the word
 *  no longer belongs in what she is going through right now. */
export function flipKnown(front) {
  const p = progress[front] ??= fresh();
  p.known = p.known ? 0 : 1;
  p.seen = today();
  saveProgress();
  drop(front);
  return p.known;
}
