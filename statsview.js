// Stats: what she has done with the whole library, in one ring and a list of
// plain numbers.  Nothing here is measured - every number is counted from the
// progress she already has, so there is nothing to keep up to date.
import { $ } from './dom.js';
import { progress, doneToday, started } from './store.js';
import { deck, poolOf, isDue } from './boards.js';
import { isMemorized } from './schedule.js';
import { ic } from './icons.js';
import { leave } from './screens.js';
import { markTab } from './nav.js';

const R = 44, C = 2 * Math.PI * R;

export function statsPage() {
  leave();
  markTab('stats');
  $('star').hidden = $('back').hidden = true;
  $('stats').hidden = true;
  $('counts').innerHTML = '<b>Stats</b>';
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

  $('main').className = 'page';
  $('main').innerHTML = `
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
    <button class="tile" id="s-today">${ic('streak')}
      <span class="n">Done today</span><span class="v">${doneToday()}</span></button>
    <div class="grp">Everything counted</div>
    <div class="pane rows">${rows.map(([n, v]) => `<div>${n}<b>${v}</b></div>`).join('')}</div>`;
  // Nothing to press: it is a number, not a way in.
  $('s-today').disabled = true;
}
