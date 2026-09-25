// A board's own page, the one a tap on the board list opens: how she is doing
// with it, the two ways into it - learn its new words or review its started
// ones - and every word on it.
import { $, esc } from './dom.js';
import { progress, settings, saveSettings, today } from './store.js';
import { deck, boardCards, learnable, reviewable, isDue, isOutBoard, flipMark } from './boards.js';
import { stats, leave, begin } from './screens.js';
import { openWord, stateOf } from './word.js';
import { ic, COG } from './icons.js';
import { boardIcon, canPick, artRow, bindArt } from './boardart.js';
import { boardSetRow, bindBoardSet, boardModeName } from './boardset.js';
import { markTab } from './nav.js';

const NAMES = { learning: 'Review', star: 'Bookmarks', pri: 'Priorities',
                known: 'Marked as known', hidden: 'Hidden' };
export const boardName = (id) => NAMES[id] ?? deck.decks.find((d) => d.id === id)?.name ?? id;

/** The filter a word falls under: hidden, know (memorized or ticked), learn, new. */
const kindOf = (c) => (progress[c.f]?.hide ? 'hidden' : stateOf(c));
const KINDS = [['all', 'All'], ['new', 'New'], ['learn', 'Learning'], ['know', 'Memorized'], ['hidden', 'Hidden']];

/** The way back into the round, on the word's own row: the crossed eye on one
 *  she hid, the tick on one she ticked off.  It stands where the word "hidden"
 *  used to - a label that named her own doing and gave her nothing to press. */
const EYE = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.7 5.3A9.4 9.4 0 0112 5.2c5 0 9 4.3 9 6.8 0 .9-.5 2-1.4 3.1M6.6 7.4C4.1 8.9 3 10.9 3 12c0 2.5 4 6.8 9 6.8 1.5 0 2.9-.4 4.1-1"/><path d="M9.9 10.1a3 3 0 004.2 4.2"/></svg>';
const TICK = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 5-5.2"/></svg>';
const undo = (k, svg) => `<span class="un" data-k="${k}" role="button" tabindex="0"
  aria-label="Put it back into the round">${svg}</span>`;

/** The right-hand side of a word's row. */
function when(c, kind) {
  const p = progress[c.f] ?? {};
  if (p.hide) return undo('hide', EYE);
  if (p.known) return undo('known', TICK);
  if (kind !== 'learn') return { new: 'new', know: '✓' }[kind];
  const d = p.due - today();
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
  stats();

  const cards = boardCards(id), kinds = cards.map(kindOf), n = settings.perDay;
  const learn = learnable(id).length, rev = reviewable(id), due = rev.filter(isDue).length;
  const count = (k) => (k === 'all' ? cards.length : kinds.filter((x) => x === k).length);
  // Known and Hidden are where a word sits out; no lesson is dealt from either,
  // so there is nothing for lesson settings to set and no bars to offer them.
  const set = !isOutBoard(id);
  // The board's row goes up into the header, above the two bars, where she put
  // it: its picture, its name, how many words it holds, and the way into its
  // settings.  It was the first row of the page, under the bars, and the page
  // then opened on a wide empty band before the first word.
  $('counts').innerHTML = `<span class="bh"><span id="b-icon">${ic(boardIcon(id))}</span>
    <b>${esc(boardName(id))}</b><span class="s">${cards.length} words</span>
    ${canPick(id) ? COG('b-cog', 'Board icon') : ''}
    ${set ? `<span class="cog" id="b-set-cog" role="button" tabindex="0" aria-label="Board settings">
      <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span>` : ''}</span>`;
  $('counts').title = boardName(id);
  // One button, and it says which of the three lessons it starts - the choice
  // lives on the shelf under the board's name, not in a second button here.
  const go = isOutBoard(id) ? '<div class="note">Tap a word to put it back into the round.</div>'
    : (rev.length || learn) ? `
    <button class="wide" id="go-lesson">${ic('learning')} <span id="go-what">${boardModeName(id)}</span>${
      settings.rand ? '' : ` ${n}`}
      <span class="s">${due ? `${due} due` : 'nothing due'} · ${learn} new on this board</span></button>` : '';
  $('main').className = 'board';
  // The board says its own name on the screen, the way every other screen does
  // and the way she drew it - not only in small letters up in the header.
  $('main').innerHTML = `
    ${canPick(id) ? artRow(id) : ''}
    ${set ? boardSetRow(id) : ''}
    <div class="go">${go}</div>
    <div class="chips filters">${KINDS.filter(([k]) => k === 'all' || count(k)).map(([k, name]) =>
      `<button data-k="${k}"${k === filter ? ' class="on"' : ''}>${name} ${count(k)}</button>`).join('')}</div>
    <div class="words">${cards.map((c, i) => filter !== 'all' && kinds[i] !== filter ? '' :
      `<button class="wd ${kinds[i]}" data-f="${esc(c.f)}">
        <span class="jp"><b>${esc(c.f)}</b>${c.k ? ` <span class="k">${esc(c.k)}</span>` : ''}</span>
        <span class="st">${when(c, kinds[i])}</span><span class="e">${esc(c.e)}</span>${
        // On Known and Hidden the words come from every board at once, so the
        // row has to say which one it will go back to.  On a board's own page
        // that would be the board's name printed against every word on it.
        isOutBoard(id) ? `<span class="from">${esc(boardName(c.d))}</span>` : ''}</button>`).join('')}</div>`;

  // The board's own kind decides what the lesson holds, so the button only has
  // to say "a lesson on this board" - buildQueue reads the rest.
  $('go-lesson')?.addEventListener('click', () => {
    settings.mode = 'learn';
    saveSettings();
    begin();
  });
  // The gear beside the board's name: her drawings slide out under it, and the
  // one she taps is this board's from then on - here, in the list, everywhere.
  if (canPick(id)) {
    $('b-cog').addEventListener('click', () => $('b-art').classList.toggle('on'));
    bindArt(id, (name) => { $('b-icon').innerHTML = ic(name); });
  }
  // The board's own settings, on the same shelf as its pictures - and only one
  // shelf is ever out, or the second would push the first off the screen.
  // Neither is on a board she cannot deal a lesson from.
  $('b-set-cog')?.addEventListener('click', () => {
    $('b-art')?.classList.remove('on');
    $('b-set').classList.toggle('on');
  });
  // Picking a kind renames the button under her finger, without drawing the
  // whole page again while the shelf is open.
  if (set) bindBoardSet(id, () => { const w = $('go-what'); if (w) w.textContent = boardModeName(id); });
  // Only the filter row, by name.  The lesson kinds on the shelf are chips too,
  // and an unscoped "every chip on the page" caught them as well: picking
  // "Mixed" set the word filter to "mix", which nothing matches, and the board
  // drew itself with no words on it at all.
  for (const b of document.querySelectorAll('.chips.filters button')) {
    b.addEventListener('click', () => { filter = b.dataset.k; openBoard(id); });
  }
  // The same box as a word tapped in a sentence; once it closes, the page shows
  // what she changed in it, scrolled where she was.
  const again = () => { const y = $('main').scrollTop; openBoard(id); $('main').scrollTop = y; };
  for (const b of document.querySelectorAll('.wd')) {
    b.addEventListener('click', (e) => {
      // The eye and the tick put the word straight back, without making her open
      // it first: on these two boards that is the only thing she came to do.
      const un = e.target.closest('.un');
      if (un) { flipMark(b.dataset.f, un.dataset.k); again(); return; }
      openWord(b, again);
    });
  }
}
