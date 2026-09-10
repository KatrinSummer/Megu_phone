// When a word comes back. SM-2, trimmed to what a vocabulary list needs.
import { progress, today, fresh, lifetime, saveProgress } from './store.js';

/** Grades the word and saves it. True means it has to come round again today. */
export function answer(card, grade) {
  const p = progress[card.f] ?? fresh();
  if (grade === 'again') {
    p.lapses++; p.reps = 0; p.iv = 0; p.ease = Math.max(1.3, p.ease - 0.2);
    p.due = today();                       // comes back later in this same session
  } else {
    if (grade === 'easy') p.ease += 0.15;
    p.iv = p.reps === 0 ? 1 : p.reps === 1 ? 3 : Math.round(p.iv * p.ease);
    if (grade === 'easy') p.iv = Math.max(2, Math.round(p.iv * 1.5));
    p.reps++;
    // reps is the rung of the ladder and drops back to the bottom on a slip;
    // total is how many times she has really recalled the word, and never drops.
    p.total = lifetime(p) + 1;
    p.due = today() + p.iv;
  }
  p.seen = today();
  progress[card.f] = p;
  saveProgress();
  return grade === 'again';
}

/** What the button will cost her, in plain words. */
export function nextIn(card, grade) {
  const p = progress[card.f] ?? { iv: 0, ease: 2.5, reps: 0 };
  let iv = p.reps === 0 ? 1 : p.reps === 1 ? 3
    : Math.round(p.iv * (p.ease + (grade === 'easy' ? 0.15 : 0)));
  if (grade === 'easy') iv = Math.max(2, Math.round(iv * 1.5));
  return iv === 1 ? 'tomorrow' : iv < 30 ? `in ${iv} days` : `in ${Math.round(iv / 30)} months`;
}

/** Parked for over a month by the schedule, or waved off by her. */
export const isMemorized = (c) => {
  const p = progress[c.f];
  return !!p && (p.known === 1 || p.iv >= 30);
};
