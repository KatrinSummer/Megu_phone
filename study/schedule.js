// When a word comes back. SM-2, trimmed to what a vocabulary list needs.
import { progress, today, fresh, lifetime, started, saveProgress } from '../core/store.js';

/** How long she waits for a word: "more often" halves what the schedule earned,
 *  "less often" doubles it. Only the wait changes - `iv` keeps what was earned,
 *  or halving it again at every review would pin the word down for good. */
const wait = (p, iv) => Math.max(1, Math.round(iv * (p.pri === 1 ? 0.5 : p.pri === -1 ? 2 : 1)));

// The four answers, and what each of them means.  There are four because
// "Hard" was carrying two jobs that are not the same thing: a word she could
// not recall at all, and a word she recalled with a struggle.
//
//   Again  she did not have it.  It comes back at the end of this lesson, and
//          keeps coming back until she answers it some other way.
//   Hard   she had it, slowly.  Always a rung below Normal, and it does NOT
//          come round again today.
//   Normal she had it: the wait grows by the ease it has earned.
//   Easy   she had it at once: the ease goes up and the wait grows half again.
//
// Four answers have to mean four different days, and on a brand new word they
// did not: Normal's first step was one day, and one day is the shortest thing
// a schedule counted in days can say, so Hard had nowhere below it to stand
// and both buttons read "tomorrow".  Normal starts at two days for that
// reason - Hard needs the day under it.
//
// How many times a word has to be met before it stays is what these numbers
// are for, and she asked for them to come from the reading rather than from
// habit.  What the reading says: about eight spaced encounters to know a word
// at all, twelve or more before an adult can recall its meaning to order;
// under six encounters and less than a third of the words survive a week,
// while at ten or more it is over four fifths.
//
// So the ladder is 2 days, 4, 8, 16, 32, 64, and a word is called memorized
// at 45 days - six recalls, not five, and each of them further from the last.
// With the first meeting and the two example sentences that ride on every
// card, that is comfortably inside the range the studies give.  Hard puts
// extra rungs in for a word she is fighting; Again takes the ladder away and
// starts it again the same day.
const HARD = 1.2;                          // what a slow recall grows the wait by
const EASY = 1.5, EASY_UP = 0.15;
const FIRST = 2, SECOND = 4;               // Normal's two fixed steps, in days

/** The wait this answer would earn, in days. Pure, and the one place the
 *  ladder is written: `answer` writes it down, the buttons say what it costs. */
function step(p, grade) {
  // A slow one climbs from where it stands rather than jumping to the next
  // rung - but it always climbs, or "hard" twice running would stand still.
  if (grade === 'hard') return p.reps === 0 ? 1 : Math.max(p.iv + 1, Math.round(p.iv * HARD));
  const iv = p.reps === 0 ? FIRST : p.reps === 1 ? SECOND
    : Math.round(p.iv * (p.ease + (grade === 'easy' ? EASY_UP : 0)));
  // Twice Normal's first step on a new word, so the three of them read 1, 2, 4.
  return grade === 'easy' ? Math.max(p.reps === 0 ? 2 * FIRST : 3, Math.round(iv * EASY)) : iv;
}

/** Grades the word and saves it. True means it has to come round again today. */
export function answer(card, grade) {
  const p = progress[card.f] ?? fresh();
  if (grade === 'again') {
    p.lapses++; p.reps = 0; p.iv = 0; p.ease = Math.max(1.3, p.ease - 0.2);
    p.due = today();                       // comes back later in this same session
  } else {
    p.iv = step(p, grade);                 // before the ease moves: the step uses it
    if (grade === 'hard') p.ease = Math.max(1.3, p.ease - EASY_UP);
    if (grade === 'easy') p.ease += EASY_UP;
    p.reps++;
    // reps is the rung of the ladder and drops back to the bottom on a slip;
    // total is how many times she has really recalled the word, and never drops.
    p.total = lifetime(p) + 1;
    p.due = today() + wait(p, p.iv);
  }
  p.seen = today();
  progress[card.f] = p;
  saveProgress();
  return grade === 'again';
}

/** What the button will cost her, in plain words. */
export function nextIn(card, grade) {
  const iv = wait(card.f in progress ? progress[card.f] : { iv: 0, ease: 2.5, reps: 0 },
    step(progress[card.f] ?? { iv: 0, ease: 2.5, reps: 0 }, grade));
  return iv === 1 ? 'tomorrow' : iv < 30 ? `in ${iv} days` : `in ${Math.round(iv / 30)} months`;
}

/** Less often · normal · more often. Like the star it is not progress, so it
 *  leaves `seen` alone; a word already on the schedule moves to its new day now. */
export function setPri(front, v) {
  const p = progress[front] ??= fresh();
  p.pri = v;
  if (started(p) && p.iv > 0 && p.seen) p.due = p.seen + wait(p, p.iv);
  saveProgress();
}

/** Parked for a month and a half by the schedule, or waved off by her.
 *  It was a month, which the ladder reached on the fifth recall; the reading
 *  wants more spaced meetings than that before a word is called learned, and
 *  45 days is the rung after it. */
export const MEMORIZED = 45;
export const isMemorized = (c) => {
  const p = progress[c.f];
  return !!p && (p.known === 1 || p.iv >= MEMORIZED);
};
