// The ring she asked for: how a pile of words stands, drawn round.
//
// Green is what she has learned, blue what she has not learned yet, grey what
// she waved off as not important.  One drawing, used big on Home and small on
// every board, so the same colours always mean the same thing.
import { progress } from './store.js';
import { isMemorized } from './schedule.js';

const R = 44, C = 2 * Math.PI * R;

/** The three piles of a set of cards, in the order they are drawn. */
export function shares(cards) {
  const hid = cards.filter((c) => progress[c.f]?.hide).length;
  const know = cards.filter((c) => !progress[c.f]?.hide
    && (isMemorized(c) || progress[c.f]?.known)).length;
  return { know, rest: cards.length - know - hid, hid };
}

/** `size` is a css length. `middle` is html laid over the hole - the number on
 *  Home - and is left out for the small ones. */
export function ring(cards, size, middle = '') {
  const { know, rest, hid } = shares(cards);
  const total = know + rest + hid;
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
    <svg viewBox="0 0 104 104" aria-label="${know} learned, ${rest} not yet, ${hid} put aside">
      <circle cx="52" cy="52" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>
      <g transform="rotate(-90 52 52)">
        ${arc(know, 'var(--good)')}${arc(rest, 'var(--fresh)')}${arc(hid, 'var(--gone)')}
      </g>
    </svg>${middle}</div>`;
}
