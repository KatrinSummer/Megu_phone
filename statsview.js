// Stats, the way she drew it: the name of the screen, and under it one of her
// three tabs - what the library is made of, the numbers behind it, or the month.
//
// Nothing here is measured.  Overview is counted from the progress she already
// has; the days and the minutes are written down as they happen, by store.js,
// and this screen only reads them.
import { $ } from './dom.js';
import { progress, doneToday, daysDone, daysTime, started, today } from './store.js';
import { deck, poolOf, isDue } from './boards.js';
import { isMemorized } from './schedule.js';
import { ic } from './icons.js';
import { leave } from './screens.js';
import { markTab } from './nav.js';
import { month } from './calendar.js';

const R = 44, C = 2 * Math.PI * R;
const TABS = [['overview', 'Overview'], ['progress', 'Progress'], ['calendar', 'Calendar']];
let tab = 'overview';
// How far back the chart looks - her picker over it.  Both are remembered while
// the app is open, the same as a board's filter.
const SPANS = [[14, 'last 14 days'], [30, 'last 30 days']];
let span = 14;

/** The days the chart draws, oldest first: [day of the month, words done]. */
const bars = () => Array.from({ length: span }, (_, i) => {
  const d = today() - (span - 1 - i);
  return [new Date(d * 86400000).getDate(), daysDone()[d] ?? 0];
});

/** Minutes, said the way a person says them. */
const clock = (m) => (m >= 60 ? `${Math.round(m / 6) / 10} h` : `${Math.round(m)} min`);
/** What a tally of hers adds up to over the days the chart is showing. */
const sum = (tally) => Object.entries(tally)
  .filter(([d]) => Number(d) > today() - span).reduce((s, [, v]) => s + v, 0);

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

  // The same four colours her ring uses, in the same order, so a colour means
  // one thing wherever she meets it.
  const legend = [['Learned', know, 'var(--r-know)'], ['Learning', learn, 'var(--r-learn)'],
    ['New', fresh, 'var(--r-new)'], ['Hidden', hid, 'var(--r-hid)']];
  const rows = [
    ['words in all', cards.length], ['started', all.filter(started).length],
    ['due for review', poolOf('learning').filter(isDue).length],
    ['bookmarked', all.filter((p) => p.star).length],
    ['known over a month', all.filter((p) => p.iv >= 30).length],
    ['marked as known', all.filter((p) => p.known).length],
    ['hidden, not important', all.filter((p) => p.hide).length],
    ['more often', all.filter((p) => p.pri === 1).length],
  ];

  const wheel = `
    <div class="pane wheel">
      <svg viewBox="0 0 104 104" aria-label="${pct}% learned">
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>
        <circle cx="52" cy="52" r="${R}" fill="none" stroke="var(--r-know)" stroke-width="12"
          stroke-linecap="round" stroke-dasharray="${(C * pct) / 100} ${C}"/>
        <text x="52" y="52" transform="rotate(90 52 52)" text-anchor="middle" dominant-baseline="central"
          class="pct" fill="var(--ink)">${pct}%</text>
      </svg>
      <div class="legend">${legend.map(([n, v, c]) =>
        `<div><i class="dot" style="background:${c}"></i>${n}<b>${v}</b></div>`).join('')}</div>
    </div>`;

  // The chart only knows about the days since this version arrived: before it,
  // nothing was written down, so an empty fortnight is the truth and not a bug.
  const days = bars();
  const top = Math.max(10, ...days.map(([, v]) => v));
  const studied = `
    <div class="pane">
      <div class="cap">Words studied
        <select id="span" aria-label="How far back">${SPANS.map(([n, name]) =>
          `<option value="${n}"${n === span ? ' selected' : ''}>${name}</option>`).join('')}</select></div>
      <div class="plot">
        <div class="axis"><span>${top}</span><span>${Math.round(top / 2)}</span><span>0</span></div>
        <div class="chart">${days.map(([d, v], i) =>
          `<i class="${v ? '' : 'none'}" style="--h:${Math.round((v / top) * 100)}%"
             title="${d}: ${v}"><span>${span <= 14 || i % 5 === 0 ? d : ''}</span></i>`).join('')}</div>
      </div>
    </div>
    <div class="cap">Study time<span>${SPANS.find(([n]) => n === span)[1]}</span></div>
    <div class="duo">
      <button id="s-time" disabled>${ic('time')}
        <span><b>${clock(sum(daysTime()))}</b><span>on the cards</span></span></button>
      <button id="s-week" disabled>${ic('chart')}
        <span><b>${sum(daysDone())}</b><span>words</span></span></button>
    </div>`;

  const numbers = `
    <div class="pane rows">${rows.map(([n, v]) => `<div>${n}<b>${v}</b></div>`).join('')}</div>
    <div class="duo">
      <button id="s-today" disabled>${ic('streak')}
        <span><b>${doneToday()}</b><span>words today</span></span></button>
      <button id="s-min" disabled>${ic('time')}
        <span><b>${clock(daysTime()[today()] ?? 0)}</b><span>today</span></span></button>
    </div>`;

  $('main').className = 'page';
  $('main').innerHTML = `
    <div class="head">${ic('stats', '44px')}<h1>Stats</h1>
      <span class="s">${cards.length} words</span></div>
    <div class="chips">${TABS.map(([k, name]) =>
      `<button data-k="${k}"${k === tab ? ' class="on"' : ''}>${name}</button>`).join('')}</div>
    ${tab === 'overview' ? wheel + studied : tab === 'progress' ? numbers : month()}`;

  for (const b of document.querySelectorAll('.chips button')) {
    b.addEventListener('click', () => { tab = b.dataset.k; statsPage(); });
  }
  $('span')?.addEventListener('change', (e) => { span = Number(e.target.value); statsPage(); });
}
