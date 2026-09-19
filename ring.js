// The ring she asked for: how a pile of words stands, drawn round.
//
// It says all four things a word can be, in her colours: blue what she knows,
// light green what she is learning, almost white what she has not started, grey
// what she waved off.  One drawing, used big on Home and small on every board,
// so the same colours always mean the same thing.
import { progress, started } from './store.js';
import { isMemorized } from './schedule.js';

const R = 44, C = 2 * Math.PI * R;

/** The four piles of a set of cards, in the order they are drawn. */
export function shares(cards) {
  const hid = cards.filter((c) => progress[c.f]?.hide).length;
  const live = cards.filter((c) => !progress[c.f]?.hide);
  const knows = (c) => isMemorized(c) || progress[c.f]?.known;
  const know = live.filter(knows).length;
  const learn = live.filter((c) => started(progress[c.f]) && !knows(c)).length;
  return { know, learn, fresh: live.length - know - learn, hid };
}

/** `size` is a css length. `middle` is html laid over the hole - the number on
 *  Home - and is left out for the small ones. */
export function ring(cards, size, middle = '') {
  const { know, learn, fresh, hid } = shares(cards);
  const total = know + learn + fresh + hid;
  let at = 0;
  const arc = (v, colour) => {
    if (!v) return '';
    const len = (v / (total || 1)) * C;
    const s = `<circle cx="52" cy="52" r="${R}" fill="none" stroke="${colour}" stroke-width="12"
      stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-at}"/>`;
    at += len;
    return s;
  };
  return `<div class="donut" style="--d:${size}">
    <svg viewBox="0 0 104 104"
      aria-label="${know} known, ${learn} being learned, ${fresh} not started, ${hid} put aside">
      <circle cx="52" cy="52" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>
      <g transform="rotate(-90 52 52)">
        ${arc(know, 'var(--r-know)')}${arc(learn, 'var(--r-learn)')}
        ${arc(fresh, 'var(--r-new)')}${arc(hid, 'var(--r-hid)')}
      </g>
    </svg>${middle}</div>`;
}
