// Which words she is shown, and in what order.
import { progress, settings, today, fresh, saveProgress, started, pri } from './store.js';
import { shuffle } from './rand.js';
import { startLesson, drop } from './lesson.js';
import { jungleRun } from './jungle.js';
import { boardWords, boardMode } from './boardset.js';
import { isMemorized } from './schedule.js';

export const deck = { cards: [], decks: [] };
export const setDeck = (d) => Object.assign(deck, d);
// The deck arrives once, before the first card is drawn.
let byFront = null;
export const cardOf = (f) => (byFront ??= new Map(deck.cards.map((c) => [c.f, c]))).get(f);

// What the board holds, whether or not she has waved a word off.  The bars
// count against this, or marking a word known would shrink the goalpost too.
// There is no board of every word: she splits them into decks on purpose.
export const boardCards = (id) => id === 'star' ? deck.cards.filter((c) => progress[c.f]?.star)
  // Priorities is where the priority is SET, so it holds every word.  It used to
  // hold only the ones she had asked for more often, and then it could not offer
  // High / Normal / Low at all: on a board of high words, Normal and Low are
  // empty by construction.  Her choice, and it turns the board into the one
  // place where any word can be given a level.
  // A copy, not the deck itself: a caller that sorted what it was handed would
  // otherwise scramble the order of the whole library.
  : id === 'pri' ? [...deck.cards]
  // Everything she has touched, learned and learning alike, because she asked
  // for both under one heading with tabs between them.  Learned is the ones she
  // ticked off herself AND the ones the schedule parked as memorized: Home counts
  // both under "learned", so a board that held only the ticked ones said 0 words
  // while the tile beside it said 2 - the same two words, in two places, with
  // two different answers.
  : id === 'known' ? deck.cards.filter((c) =>
      progress[c.f]?.known || isMemorized(c) || started(progress[c.f]))
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

/** Boards that deal no lesson. The two above, and Priorities - which is where a
 *  level is SET, not a pile to drill. A lesson button and a shelf of lesson
 *  settings on a board that never deals one is a control answering a question
 *  nobody asked: she found "Mixed" sitting at the top of Priorities and asked
 *  what on earth it was for. Nothing, is the honest answer. */
export const noLesson = (id) => isOutBoard(id) || id === 'pri';

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

/** "More often" first and "less often" last; within that the newest lesson
 *  first, so what she just learned is what she sees first. */
const byTurn = (a, b) => pri(b) - pri(a) || (b.when || '').localeCompare(a.when || '');

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
  // Which of the three this board deals.  The Review board's own button asks for
  // repeats outright and is not a board of hers to set, so it still wins.
  const kind = settings.mode === 'review' ? 'review' : boardMode(id);
  // A review: n of her started words, whether their day has come or not.
  if (kind === 'review') {
    return refill(withFavourites(reviewable(id).sort(byDue).slice(0, n)).slice(0, n));
  }
  // New words only - the lesson the app used to deal, kept for a day she wants
  // nothing but new ones.
  if (kind === 'new') return refill(learnable(id).sort(byTurn).slice(0, n));
  // One lesson, not two piles.  The words whose day has come go in first and new
  // ones take the room that is left: a heavy day is nearly all repeats, a clear
  // day is nearly all new words, and there is no threshold to set - the size of
  // the lesson balances it by itself.
  //
  // Always some new words, though: a tenth of the lesson, so she never opens it
  // to a wall of repeats.  A tenth is what it can afford.  Measured over half a
  // year on her deck, two new in twenty costs nothing anyone could see, three
  // leaves 190 words waiting instead of 11, and five leaves 586 - because every
  // new word is a repeat tomorrow, and a forgotten one comes back the same day.
  const some = Math.ceil(n / 10);
  const brandNew = learnable(id).sort(byTurn);
  const waiting = reviewable(id).sort(byDue);
  const take = brandNew.slice(0, Math.max(some, n - waiting.length));
  const back = waiting.slice(0, n - take.length);
  // Shuffled together: eighteen repeats and then two new words at the end is
  // two lessons in a row, not one lesson.
  refill(shuffle(withFavourites([...back, ...take])).slice(0, n));
}

/** `key` is 'known' (the tick, "I know it") or 'hide' (the eye, "not
 *  important"). The one clears the other; either way the word no longer
 *  belongs in what she is going through right now. */
/** The tick on a word's own row, on the Known board: put it back into the round.
 *  Two different words wear that tick - one she ticked off herself, and one the
 *  schedule parked as memorized - and the same press has to mean the same thing
 *  on both, or the mark is a lie on one of the two rows. */
export function putBack(front) {
  const p = progress[front] ??= fresh();
  if (p.known) return flipMark(front, 'known');
  // Nothing to un-tick: what is holding this one out of the round is the month
  // the schedule gave it, so the wait is what goes.  Everything it earned - how
  // many times she has recalled it, how easy it is - is left alone.
  p.iv = 0;
  p.due = today();
  saveProgress();
  drop(front);
}

export function flipMark(front, key) {
  const p = progress[front] ??= fresh();
  p[key] = p[key] ? 0 : 1;
  if (p[key]) p[key === 'known' ? 'hide' : 'known'] = 0;
  p.seen = today();
  saveProgress();
  drop(front);
  return p[key];
}
