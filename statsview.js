// Stats, the way she drew it: the name of the screen, then either the ring and
// what it is made of, or the days she has studied.
//
// Nothing here is measured - every number on Overview is counted from the
// progress she already has.  Progress is the one thing that has to be written
// down as it happens, and store.js does that, a tally a day.
import { $ } from './dom.js';
import { progress, doneToday, daysDone, started, today } from './store.js';
import { deck, poolOf, isDue } from './boards.js';
import { isMemorized } from './schedule.js';
import { ic } from './icons.js';
import { leave } from './screens.js';
import { markTab } from './nav.js';

const R = 44, C = 2 * Math.PI * R;
const TABS = [['overview', 'Overview'], ['progress', 'Progress']];
let tab = 'overview';

const DAYS = 14;
/** The last two weeks, oldest first: [label, words done that day]. */
function fortnight() {
  const days = daysDone(), now = today();
  return Array.from({ length: DAYS }, (_, i) => {
    const d = now - (DAYS - 1 - i);
    return [new Date(d * 86400000).getDate(), days[d] ?? 0];
  });
}

export function statsPage() {
  leave();
  markTab('stats');
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = '';                   // the heading on the screen says it
  $('counts').title = 'Stats';

  const all = Object.values(progress);
  const cards = deck.cards;
  const hid = cards.filter((c) => progress[c.f]?.hide).length;
  const know = cards.filter((c) => !progress[c.f]?.hide && (isMemorized(c) || progress[c.f]?.known)).length;
  const learn = cards.filter((c) => !progress[c.f]?.hide && started(progress[c.f])
    && !(isMemorized(c) || progress[c.f]?.known)).length;
  const fresh = cards.length - know - learn - hid;
  const pct = cards.length ? Math.round((know / cards.length) * 100) : 0;

  const legend = [['Learned', know, 'var(--good)'], ['Learning', learn, 'var(--w-learn)'],
    ['New', fresh, 'var(--dim)'], ['Hidden', hid, 'var(--pink)']];
  const rows = [
    ['words in all', cards.length], ['started', all.filter(started).length],
    ['due for review', poolOf('learning').filter(isDue).length],
    ['bookmarked', all.filter((p) => p.star).length],
    ['known over a month', all.filter((p) => p.iv >= 30).length],
    ['marked as known', all.filter((p) => p.known).length],
    ['hidden, not important', all.filter((p) => p.hide).length],
    ['more often', all.filter((p) => p.pri === 1).length],
  ];

  const bars = fortnight();
  const top = Math.max(10, ...bars.map(([, v]) => v));
  const week = bars.slice(-7).reduce((s, [, v]) => s + v, 0);

  const overview = `
    <div class="pane wheel">
      <svg viewBox="0 0 104 104" aria-label="${pct}% learned">
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="var(--good)" stroke-width="12"
          stroke-linecap="round" stroke-dasharray="${(C * pct) / 100} ${C}"/>
        <text x="52" y="52" transform="rotate(90 52 52)" text-anchor="middle" dominant-baseline="central"
          class="pct" fill="var(--ink)">${pct}%</text>
      </svg>
      <div class="legend">${legend.map(([n, v, c]) =>
        `<div><i class="dot" style="background:${c}"></i>${n}<b>${v}</b></div>`).join('')}</div>
    </div>
    <div class="pane rows">${rows.map(([n, v]) => `<div>${n}<b>${v}</b></div>`).join('')}</div>`;

  // The chart only knows about the days since this version arrived: before it,
  // nothing was written down, so an empty fortnight is the truth and not a bug.
  const words = `
    <div class="pane">
      <div class="cap">Words studied<span>last ${DAYS} days</span></div>
      <div class="chart">${bars.map(([d, v]) =>
        `<i class="${v ? '' : 'none'}" style="--h:${Math.round((v / top) * 100)}%"
           title="${d}: ${v}"><span>${d}</span></i>`).join('')}</div>
    </div>
    <div class="duo">
      <button id="s-week" disabled>${ic('chart')}<span><b>${week}</b><span>this week</span></span></button>
      <button id="s-today" disabled>${ic('streak')}<span><b>${doneToday()}</b><span>today</span></span></button>
    </div>`;

  $('main').className = 'page';
  $('main').innerHTML = `
    <div class="head">${ic('stats', '44px')}<h1>Stats</h1>
      <span class="s">${cards.length} words</span></div>
    <div class="chips">${TABS.map(([k, name]) =>
      `<button data-k="${k}"${k === tab ? ' class="on"' : ''}>${name}</button>`).join('')}</div>
    ${tab === 'overview' ? overview : words}`;

  for (const b of document.querySelectorAll('.chips button')) {
    b.addEventListener('click', () => { tab = b.dataset.k; statsPage(); });
  }
}
