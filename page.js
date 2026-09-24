// A board's own page, the one a tap on the board list opens: how she is doing
// with it, the two ways into it - learn its new words or review its started
// ones - and every word on it.
import { $, esc } from './dom.js';
import { progress, settings, saveSettings, today } from './store.js';
import { deck, boardCards, learnable, reviewable, isDue, isOutBoard } from './boards.js';
import { stats, leave, begin } from './screens.js';
import { openWord, stateOf } from './word.js';
import { ic, COG } from './icons.js';
import { boardIcon, canPick, artRow, bindArt } from './boardart.js';
import { boardSetRow, bindBoardSet } from './boardset.js';
import { markTab } from './nav.js';

const NAMES = { learning: 'Review', star: 'Bookmarks', pri: 'Priorities',
                known: 'Marked as known', hidden: 'Hidden' };
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

/** Where she came in from, so the back arrow puts her back there.  Tapping
 *  "hidden" on Home and landing in the board list is not going back. */
let from = 'decks';
export const cameFromHome = () => from === 'home';
/** For a lesson started without opening a board at all - Home's own button and
 *  the jungle - so the way back out of it is the way she came in. */
export const cameIn = (where) => { from = where; };

/** `where` is 'home' or 'decks'; left out, the board keeps the way in it had -
 *  coming back from its own lesson is not a new way in. */
export function openBoard(id, where = from) {
  from = where;
  leave();
  markTab('decks');
  if (id !== filterOf) { filter = 'all'; filterOf = id; }
  settings.deck = id;
  saveSettings();
  $('star').hidden = true;
  $('back').hidden = false;
  // The board's name is in her big heading on the screen now, so the header
  // keeps quiet: it was saying the same word twice, one line above the other.
  $('counts').innerHTML = '';
  $('counts').title = boardName(id);
  stats();

  const cards = boardCards(id), kinds = cards.map(kindOf), n = settings.perDay;
  const learn = learnable(id).length, rev = reviewable(id), due = rev.filter(isDue).length;
  const count = (k) => (k === 'all' ? cards.length : kinds.filter((x) => x === k).length);
  const go = isOutBoard(id) ? '<div class="note">Tap a word to put it back into the round.</div>' : `
    ${rev.length ? `<button class="wide" id="review">${ic('learning')} ${
      settings.rand ? 'Review' : `Review ${Math.min(n, rev.length)}`}
      <span class="s">${due ? `${due} due` : 'nothing due'} · ${rev.length} started</span></button>` : ''}
    ${learn ? `<button class="wide" id="learn">${
      settings.rand ? 'Learn new words' : `Learn ${Math.min(n, learn)} new`}
      <span class="s">${learn} new on this board</span></button>` : ''}`;
  $('main').className = 'board';
  // The board says its own name on the screen, the way every other screen does
  // and the way she drew it - not only in small letters up in the header.
  $('main').innerHTML = `
    <div class="head"><span id="b-icon">${ic(boardIcon(id))}</span><h1>${esc(boardName(id))}</h1>
      <span class="s">${cards.length} words</span>
      ${canPick(id) ? COG('b-cog', 'Board icon') : ''}
      <span class="cog" id="b-set-cog" role="button" tabindex="0" aria-label="Board settings">
        <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span></div>
    ${canPick(id) ? artRow(id) : ''}
    ${boardSetRow(id)}
    <div class="go">${go}</div>
    <div class="chips">${KINDS.filter(([k]) => k === 'all' || count(k)).map(([k, name]) =>
      `<button data-k="${k}"${k === filter ? ' class="on"' : ''}>${name} ${count(k)}</button>`).join('')}</div>
    <div class="words">${cards.map((c, i) => filter !== 'all' && kinds[i] !== filter ? '' :
      `<button class="wd ${kinds[i]}" data-f="${esc(c.f)}">
        <span class="jp"><b>${esc(c.f)}</b>${c.k ? ` <span class="k">${esc(c.k)}</span>` : ''}</span>
        <span class="st">${when(c, kinds[i])}</span><span class="e">${esc(c.e)}</span>${
        // On Known and Hidden the words come from every board at once, so the
        // row has to say which one it will go back to.  On a board's own page
        // that would be the board's name printed against every word on it.
        isOutBoard(id) ? `<span class="from">${esc(boardName(c.d))}</span>` : ''}</button>`).join('')}</div>`;

  for (const m of ['learn', 'review']) {
    $(m)?.addEventListener('click', () => { settings.mode = m; saveSettings(); begin(); });
  }
  // The gear beside the board's name: her drawings slide out under it, and the
  // one she taps is this board's from then on - here, in the list, everywhere.
  if (canPick(id)) {
    $('b-cog').addEventListener('click', () => $('b-art').classList.toggle('on'));
    bindArt(id, (name) => { $('b-icon').innerHTML = ic(name); });
  }
  // The board's own settings, on the same shelf as its pictures - and only one
  // shelf is ever out, or the second would push the first off the screen.
  $('b-set-cog').addEventListener('click', () => {
    $('b-art')?.classList.remove('on');
    $('b-set').classList.toggle('on');
  });
  bindBoardSet(id);
  for (const b of document.querySelectorAll('.chips button')) {
    b.addEventListener('click', () => { filter = b.dataset.k; openBoard(id); });
  }
  // The same box as a word tapped in a sentence; once it closes, the page shows
  // what she changed in it, scrolled where she was.
  const again = () => { const y = $('main').scrollTop; openBoard(id); $('main').scrollTop = y; };
  for (const b of document.querySelectorAll('.wd')) b.addEventListener('click', () => openWord(b, again));
}
