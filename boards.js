// Which words she is shown, and in what order.
import { progress, settings, today, fresh, saveProgress, started } from './store.js';
import { startLesson, drop } from './lesson.js';
import { jungleRun } from './jungle.js';
import { boardWords } from './boardset.js';

export const deck = { cards: [], decks: [] };
export const setDeck = (d) => Object.assign(deck, d);
// The deck arrives once, before the first card is drawn.
let byFront = null;
export const cardOf = (f) => (byFront ??= new Map(deck.cards.map((c) => [c.f, c]))).get(f);

// What the board holds, whether or not she has waved a word off.  The bars
// count against this, or marking a word known would shrink the goalpost too.
// There is no board of every word: she splits them into decks on purpose.
export const boardCards = (id) => id === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  // The words she asked to see more often, gathered in one place - her concept
  // calls them Priorities.
  : id === 'pri' ? deck.cards.filter((c) => progress[c.f]?.pri === 1)
  : id === 'known' ? deck.cards.filter((c) => progress[c.f]?.known)
  : id === 'hidden' ? deck.cards.filter((c) => progress[c.f]?.hide)
  // Review: every word she has started, from every deck.
  : id === 'learning' ? deck.cards.filter((c) => started(progress[c.f]))
  // A word sits in its own deck and may also sit in a review deck like Last.
  : deck.cards.filter((c) => c.d === id || c.last === id);

/** Out of the round: she ticked it as known, or hid it as not important. */
export const isOut = (c) => !!(progress[c.f]?.known || progress[c.f]?.hide);

/** The Known and Hidden boards are the way back, not a lesson: the box of a
 *  word on their page puts it back into rotation. */
export const isOutBoard = (id) => id === 'known' || id === 'hidden';

// What she will actually be shown.
export const poolOf = (id) => isOutBoard(id) ? boardCards(id)
  : boardCards(id).filter((c) => !isOut(c));
export const pool = () => poolOf(settings.deck);

/** Never answered: a star or a priority set on a word does not start it. */
export const isNew = (c) => !started(progress[c.f]);
export const isDue = (c) => started(progress[c.f]) && progress[c.f].due <= today();

/** What the two buttons on a board's page start: its new words, and its started ones. */
export const learnable = (id) => poolOf(id).filter(isNew);
export const reviewable = (id) => poolOf(id).filter((c) => !isNew(c));

// Every new list of cards is a new lesson.
const refill = startLesson;

const pri = (c) => progress[c.f]?.pri ?? 0;
/** "More often" first and "less often" last; within that the newest lesson
 *  first, so what she just learned is what she sees first. */
const byTurn = (a, b) => pri(b) - pri(a) || (b.when || '').localeCompare(a.when || '');
const shuffle = (list) => list.sort(() => Math.random() - 0.5);

/** The words she wants more often turn up in every review, at random, due or
 *  not and whether or not they belong to it: her share is five of twenty, seven
 *  of thirty - one card in four, rounded down, which is exactly those numbers.
 *  They are mixed INTO the lesson, not added on top: the list is cut back to the
 *  lesson's size afterwards, so twenty stays twenty.
 *  A share, not a quota: with two such words in the whole deck, a lesson gets
 *  two. */
const SHARE = 4;
function withFavourites(list) {
  const here = new Set(list.map((c) => c.f));
  const extra = shuffle(deck.cards.filter((c) => pri(c) === 1 && !progress[c.f].known && !here.has(c.f)))
    // Never none: rounding down alone gives zero for any lesson under four, and
    // a word she asked to see more often would be shut out of a short review
    // altogether - which is the one thing "more often" must never mean.
    .slice(0, Math.max(1, Math.floor(list.length / SHARE)));
  for (const c of extra) list.splice(Math.floor(Math.random() * (list.length + 1)), 0, c);
  return list;
}

/** The word whose day came first goes first; one already done today goes last,
 *  so "review more" moves on instead of starting over with what she just saw. */
const byDue = (a, b) => {
  const p = progress[a.f], q = progress[b.f];
  return (p?.seen === today()) - (q?.seen === today()) || (p?.due ?? 0) - (q?.due ?? 0);
};

/** What the button she pressed started: `settings.mode` is 'learn', 'review' or
 *  'jungle'. */
export function buildQueue() {
  // How many this board deals: its own number where she has set one, and the
  // app's - Random included - where she has not.
  const id = settings.deck, n = boardWords(id);
  // The jungle belongs to no board: a run out of every word still in the round.
  if (settings.mode === 'jungle') return refill(jungleRun(deck.cards.filter((c) => !isOut(c))));
  // A review: n of her started words, whether their day has come or not.
  if (settings.mode === 'review') {
    return refill(withFavourites(reviewable(id).sort(byDue).slice(0, n)).slice(0, n));
  }
  // A lesson is for learning: new words only. What she has started comes back in a review.
  refill(learnable(id).sort(byTurn).slice(0, n));
}

/** `key` is 'known' (the tick, "I know it") or 'hide' (the eye, "not
 *  important"). The one clears the other; either way the word no longer
 *  belongs in what she is going through right now. */
export function flipMark(front, key) {
  const p = progress[front] ??= fresh();
  p[key] = p[key] ? 0 : 1;
  if (p[key]) p[key === 'known' ? 'hide' : 'known'] = 0;
  p.seen = today();
  saveProgress();
  drop(front);
  return p[key];
}
