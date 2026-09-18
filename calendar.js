// The month, day by day: which days she studied, and how much.
//
// It only reads the tally store.js keeps - the same one Stats draws as bars -
// so a day is filled in here exactly when it was counted there.
import { daysDone, today } from './store.js';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const at = (d) => new Date(d * 86400000);
/** The weekday of a day number, counted from Monday: her week starts there. */
const dow = (d) => (at(d).getDay() + 6) % 7;
const dayOf = (y, m, d) => Math.floor(new Date(y, m, d).setHours(0, 0, 0, 0) / 86400000);

/** This month as a grid.  A day with nothing on it keeps its place, and the
 *  more she did on a day the stronger its green: the shape of the month is the
 *  point, not the exact number, which the cell says when it is held. */
export function month() {
  const days = daysDone(), now = today(), here = at(now);
  const first = dayOf(here.getFullYear(), here.getMonth(), 1);
  const last = dayOf(here.getFullYear(), here.getMonth() + 1, 0);

  const cells = Array.from({ length: dow(first) }, () => '<i></i>');
  for (let d = first; d <= last; d++) {
    const n = days[d] ?? 0;
    const level = !n ? 0 : n < 10 ? 1 : n < 25 ? 2 : 3;
    cells.push(`<i class="l${level}${d === now ? ' now' : ''}"
      title="${n} ${n === 1 ? 'word' : 'words'}">${at(d).getDate()}</i>`);
  }

  const mine = Object.entries(days).filter(([d]) => Number(d) >= first && Number(d) <= last);
  const total = mine.reduce((s, [, v]) => s + v, 0);
  const studied = mine.filter(([, v]) => v > 0).length;
  return `<div class="pane">
    <div class="cap">${here.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
      <span>${studied} ${studied === 1 ? 'day' : 'days'} · ${total} words</span></div>
    <div class="cal">${WEEK.map((w) => `<b>${w}</b>`).join('')}${cells.join('')}</div>
  </div>`;
}
