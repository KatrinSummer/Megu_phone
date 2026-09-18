// A board's own page, the one a tap on the board list opens: how she is doing
// with it, the two ways into it - learn its new words or review its started
// ones - and every word on it.
import { $, esc } from './dom.js';
import { progress, settings, saveSettings, today } from './store.js';
import { deck, boardCards, learnable, reviewable, isDue, isOutBoard } from './boards.js';
import { stats, leave, begin } from './screens.js';
import { openWord, stateOf } from './word.js';
import { ic } from './icons.js';
import { markTab } from './nav.js';

const NAMES = { learning: 'Review', star: 'Bookmarks', known: 'Marked as known', hidden: 'Hidden' };
export const boardName = (id) => NAMES[id] ?? deck.decks.find((d) => d.id === id)?.name ?? id;

/** The filter a word falls under: hidden, know (memorized or ticked), learn, new. */
const kindOf = (c) => (progress[c.f]?.hide ? 'hidden' : stateOf(c));
const KINDS = [['all', 'All'], ['new', 'New'], ['learn', 'Learning'], ['know', 'Memorized'], ['hidden', 'Hidden']];

/** The right-hand side of a word's row. */
function when(c, kind) {
  if (kind !== 'learn') return { new: 'new', know: '✓', hidden: 'hidden' }[kind];
  const d = progress[c.f].due - today();
  return d <= 0 ? 'due' : d === 1 ? 'tomorrow' : `in ${d} d`;
}

// The filter stays while she goes in and out of the same board's lessons.
let filter = 'all', filterOf = null;

export function openBoard(id) {
  leave();
  markTab('decks');
  if (id !== filterOf) { filter = 'all'; filterOf = id; }
  settings.deck = id;
  saveSettings();
  $('star').hidden = true;
  $('back').hidden = false;
  $('counts').innerHTML = `<b>${esc(boardName(id))}</b>`;
  $('counts').title = boardName(id);
  stats();

  const cards = boardCards(id), kinds = cards.map(kindOf), n = settings.perDay;
  const learn = learnable(id).length, rev = reviewable(id), due = rev.filter(isDue).length;
  const count = (k) => (k === 'all' ? cards.length : kinds.filter((x) => x === k).length);
  const go = isOutBoard(id) ? '<div class="note">Tap a word to put it back into the round.</div>' : `
    ${learn ? `<button class="wide" id="learn">Learn ${Math.min(n, learn)} new
      <span class="s">${learn} new on this board</span></button>` : ''}
    ${rev.length ? `<button class="wide" id="review">${ic('learning')} Review ${Math.min(n, rev.length)}
      <span class="s">${due ? `${due} due` : 'nothing due'} · ${rev.length} started</span></button>` : ''}`;
  $('main').className = 'board';
  $('main').innerHTML = `<div class="go">${go}</div>
    <div class="chips">${KINDS.filter(([k]) => k === 'all' || count(k)).map(([k, name]) =>
      `<button data-k="${k}"${k === filter ? ' class="on"' : ''}>${name} ${count(k)}</button>`).join('')}</div>
    <div class="words">${cards.map((c, i) => filter !== 'all' && kinds[i] !== filter ? '' :
      `<button class="wd ${kinds[i]}" data-f="${esc(c.f)}">
        <span class="jp"><b>${esc(c.f)}</b>${c.k ? ` <span class="k">${esc(c.k)}</span>` : ''}</span>
        <span class="st">${when(c, kinds[i])}</span><span class="e">${esc(c.e)}</span></button>`).join('')}</div>`;

  for (const m of ['learn', 'review']) {
    $(m)?.addEventListener('click', () => { settings.mode = m; saveSettings(); begin(); });
  }
  for (const b of document.querySelectorAll('.chips button')) {
    b.addEventListener('click', () => { filter = b.dataset.k; openBoard(id); });
  }
  // The same box as a word tapped in a sentence; once it closes, the page shows
  // what she changed in it, scrolled where she was.
  const again = () => { const y = $('main').scrollTop; openBoard(id); $('main').scrollTop = y; };
  for (const b of document.querySelectorAll('.wd')) b.addEventListener('click', () => openWord(b, again));
}
