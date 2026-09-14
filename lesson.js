// The lesson she is going through: the cards still to go, the ones that come
// round once more after the last of them, how each went the first time, and
// where a reload finds her again.
import { today, loadLesson, saveLesson } from './store.js';

// One array each for the life of the session, so everyone holds the same lesson.
export const queue = [];
/** Forgotten or skipped: each comes round once more after the last card. */
export const again = [];
/** How each card went the first time it came up, for the summary at the end. */
export const first = new Map();
export const lesson = { repeating: false };

export function startLesson(list) {
  queue.length = 0;
  queue.push(...list);
  again.length = 0;
  first.clear();
  lesson.repeating = false;
}

/** The next card: the lesson first, then once more what she missed. The count
 *  she is shown is what is left of the lesson, so it goes down at every card -
 *  a forgotten one waits at the end instead of going back into it. */
export function nextCard() {
  if (!queue.length && again.length) {
    queue.push(...again.splice(0));
    lesson.repeating = true;
  }
  return queue.shift() ?? null;
}

/** A word she waved off leaves the lesson, the end of it included. */
export function drop(front) {
  for (const list of [queue, again]) {
    for (let i = list.length - 1; i >= 0; i--) if (list[i].f === front) list.splice(i, 1);
  }
}

// Written at every card: a new version reloads the app, and the phone closes it
// behind her back - either way she is put back on the card she was on, today.
export const keep = (deck, current) => saveLesson({
  day: today(), deck, cards: [current, ...queue].map((c) => c.f), again: again.map((c) => c.f),
  repeating: lesson.repeating, first: [...first],
});
export const forget = () => saveLesson(null);

/** The board of the lesson she was in today, set up again; null when there is none. */
export function resume(cardOf) {
  const r = loadLesson();
  if (!r || r.day !== today()) return null;
  const cards = (fronts) => fronts.map(cardOf).filter(Boolean);
  startLesson(cards(r.cards));
  again.push(...cards(r.again));
  lesson.repeating = r.repeating;
  for (const [f, how] of r.first) first.set(f, how);
  return queue.length ? r.deck : null;
}
