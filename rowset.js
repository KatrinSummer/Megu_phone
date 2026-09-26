// The switch a board puts on a word's own row.
//
// Two boards exist to change one setting each - Priorities sets how often a word
// comes round, Learned says whether she is done with it - and she asked to change
// that setting where she can see it, on the row, instead of opening the word's
// box first. The box still does it; this is the short way on the page that is
// for nothing else.
import { esc } from './dom.js';
import { progress } from './store.js';
import { setPri } from './schedule.js';
import { flipMark, putBack } from './boards.js';

/** The value it currently stands at wears the paint, so the row says what the
 *  word is as well as offering to change it. */
/** "rowset-pri", not "pri": the word's box already paints a `.pri` of its own,
 *  centred, and a second thing under that name quietly took its centring - the
 *  switch sat a third of the way in instead of under the word.  Same trap `.top`
 *  sprang when Home's figure row and the word popup both claimed it. */
const row = (kind, front, now, levels) =>
  `<span class="rowset rowset-${kind}" data-f="${esc(front)}">${levels.map(([v, name]) =>
    `<span class="p${v === now ? ' on' : ''}" data-v="${v}" role="button" tabindex="0"
      >${name}</span>`).join('')}</span>`;

/** Low, Normal, High - the same three the board's own tabs are named after, in
 *  the same order. Two names for one thing on one screen is the screen
 *  contradicting itself. */
const PRI = [[-1, 'Low'], [0, 'Normal'], [1, 'High']];
export const priRow = (front) => row('pri', front, progress[front]?.pri ?? 0, PRI);

const LEARN = [['learned', 'Learned'], ['learning', 'Learning']];
export const learnRow = (front, now) => row('learn', front, now, LEARN);

/** A tap sets it and draws the page again. It must not reach the row underneath:
 *  that row opens the word, and she came to press the switch. */
export function bindRowset(redraw) {
  for (const s of document.querySelectorAll('.rowset .p')) {
    s.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = s.parentElement, f = box.dataset.f, v = s.dataset.v;
      if (box.classList.contains('rowset-pri')) setPri(f, Number(v));
      // Two states, and the word is already in one of them: pressing the side it
      // already stands at is a press with nothing to do, not a toggle back.
      else if (s.classList.contains('on')) return;
      // Learned covers two different words - one she ticked off herself and one
      // the schedule parked - so putting it back goes through the one place that
      // knows the difference.
      else if (v === 'learned') flipMark(f, 'known');
      else putBack(f);
      redraw();
    });
  }
}
